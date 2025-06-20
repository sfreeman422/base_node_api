import { AuthService } from './auth.service';
import { Logger } from '../logger/logger.service';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { unableToFindUser, unexpectedError } from '../../constants/message.constants';
import { User } from '../../db/models/User/User';

jest.mock('argon2');
jest.mock('jsonwebtoken');

const mockQuery = jest.fn();
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockUser: Partial<User> = { id: 'user-id', email: 'test@example.com', password: 'hashed' };
const mockToken = 'mock.jwt.token';
const mockRefreshToken = 'mock.refresh.token';

describe('AuthService', () => {
  let authService: AuthService;
  let db: Partial<pg.Pool>;

  beforeEach(() => {
    db = { query: mockQuery };
    authService = new AuthService(mockLogger as unknown as Logger, db as pg.Pool);
    process.env.AUTH_PRIVATE_KEY = 'secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTH_PRIVATE_KEY;
  });

  describe('isValidUser', () => {
    it('should return true if user is found', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      await expect(authService.isValidUser('user-id')).resolves.toBe(true);
    });

    it('should return false and log error if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(authService.isValidUser('user-id')).resolves.toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw and log error on db error', async () => {
      mockQuery.mockRejectedValue(new Error('db error'));
      await expect(authService.isValidUser('user-id')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('confirmJwt', () => {
    it('should resolve decoded token if valid and user exists', async () => {
      (jwt.verify as jest.Mock).mockImplementation((token, secret, opts, cb) => {
        cb(null, { user: 'user-id' });
      });
      jest.spyOn(authService, 'isValidUser').mockResolvedValue(true);
      await expect(authService.confirmJwt('token')).resolves.toEqual({ user: 'user-id' });
    });

    it('should reject if user does not exist', async () => {
      expect.assertions(2);
      (jwt.verify as jest.Mock).mockImplementation((token, secret, opts, cb) => {
        cb(null, { user: 'user-id' });
      });
      jest.spyOn(authService, 'isValidUser').mockResolvedValue(false);
      const jsonWebTokenErrorSpy = jest.spyOn(jwt, 'JsonWebTokenError');
      await authService.confirmJwt('token').catch((e) => {
        expect(e).toBeInstanceOf(jwt.JsonWebTokenError);
      });
      expect(jsonWebTokenErrorSpy).toHaveBeenCalledWith(unableToFindUser);
    });

    it('should reject if jwt.verify errors', async () => {
      (jwt.verify as jest.Mock).mockImplementation((token, secret, opts, cb) => {
        cb(new Error('jwt error'));
      });
      await expect(authService.confirmJwt('token')).rejects.toThrow('jwt error');
    });

    it('should throw if no private key', async () => {
      expect.assertions(2);
      delete process.env.AUTH_PRIVATE_KEY;
      const jsonWebTokenErrorSpy = jest.spyOn(jwt, 'JsonWebTokenError');
      await authService.confirmJwt('token').catch((e) => {
        expect(e).toBeInstanceOf(jwt.JsonWebTokenError);
      });
      expect(jsonWebTokenErrorSpy).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('login', () => {
    it('should return AuthToken if email and password correct', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jest
        .spyOn(authService, 'createNewJwt')
        .mockResolvedValue({ bearerToken: mockToken, refreshToken: mockRefreshToken });
      await expect(authService.login('test@example.com', 'password', 'cid')).resolves.toEqual({
        bearerToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw and log error if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(authService.login('test@example.com', 'password', 'cid')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw and log error if password does not match', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(authService.login('test@example.com', 'password', 'cid')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw and log error if createNewJwt fails', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jest.spyOn(authService, 'createNewJwt').mockRejectedValue(new Error('jwt error'));
      await expect(authService.login('test@example.com', 'password', 'cid')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('passwordMatch', () => {
    it('should resolve true if password matches', async () => {
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      await expect(authService.passwordMatch('plain', 'hashed', 'cid')).resolves.toBe(true);
    });

    it('should throw and log error if argon2 throws', async () => {
      (argon2.verify as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(authService.passwordMatch('plain', 'hashed', 'cid')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should return message if user found', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      await expect(authService.resetPassword('test@example.com', 'cid')).resolves.toContain(mockUser.email);
    });

    it('should throw and log error if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(authService.resetPassword('test@example.com', 'cid')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('callJwtSign', () => {
    it('should resolve encoded token if successful', async () => {
      (jwt.sign as jest.Mock).mockImplementation((payload, secret, opts, cb) => cb(null, mockToken));
      await expect(authService.callJwtSign('user-id', 'secret', {}, 'cid')).resolves.toBe(mockToken);
    });

    it('should reject and log error if jwt.sign errors', async () => {
      (jwt.sign as jest.Mock).mockImplementation((payload, secret, opts, cb) => cb(new Error('sign error')));
      await expect(authService.callJwtSign('user-id', 'secret', {}, 'cid')).rejects.toThrow('sign error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should reject and log error if encoded is falsy', async () => {
      (jwt.sign as jest.Mock).mockImplementation((payload, secret, opts, cb) => cb(null, undefined));
      await expect(authService.callJwtSign('user-id', 'secret', {}, 'cid')).rejects.toBeDefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('refreshJwt', () => {
    it('should return AuthToken if user found', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUser] });
      jest
        .spyOn(authService, 'createNewJwt')
        .mockResolvedValue({ bearerToken: mockToken, refreshToken: mockRefreshToken });
      await expect(authService.refreshJwt('user-id', 'cid')).resolves.toEqual({
        bearerToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(authService.refreshJwt('user-id', 'cid')).rejects.toThrow();
    });
  });

  describe('createNewJwt', () => {
    it('should call createNewBearerToken and createNewRefreshToken', async () => {
      jest.spyOn(authService, 'createNewBearerToken').mockResolvedValue(mockToken);
      jest.spyOn(authService, 'createNewRefreshToken').mockResolvedValue(mockRefreshToken);
      await expect(authService.createNewJwt(mockUser as User, 'cid')).resolves.toEqual({
        bearerToken: mockToken,
        refreshToken: mockRefreshToken,
      });
    });
  });

  describe('createNewBearerToken', () => {
    it('should call callJwtSign', async () => {
      jest.spyOn(authService, 'callJwtSign').mockResolvedValue(mockToken);
      await expect(authService.createNewBearerToken(mockUser as User, 'cid')).resolves.toBe(mockToken);
    });
  });

  describe('createNewRefreshToken', () => {
    it('should call callJwtSign', async () => {
      jest.spyOn(authService, 'callJwtSign').mockResolvedValue(mockRefreshToken);
      await expect(authService.createNewRefreshToken(mockUser as User, 'cid')).resolves.toBe(mockRefreshToken);
    });
  });
});
