import { UserService } from './user.service';
import * as argon2 from 'argon2';
import pg from 'pg';
import { validate } from 'class-validator';
import { validateEmail } from '../../utils/validateEmail';
import { AuthService } from '../auth/auth.service';
import { User } from '../../db/models/User/User';
import { Logger } from '../logger/logger.service';

jest.mock('argon2');
jest.mock('class-validator');
jest.mock('uuid');
jest.mock('../../utils/validateEmail', () => ({
  validateEmail: jest.fn(),
}));

const mockDb: Partial<pg.Pool> = {
  query: jest.fn(),
};

const mockAuthService: Partial<AuthService> = {
  passwordMatch: jest.fn(),
  createNewJwt: jest.fn(),
};

const mockLogger: Partial<Logger> = {
  error: jest.fn(),
};

const user: User = {
  id: 'user-id',
  email: 'test@example.com',
  password: 'Th1Sis@Test',
  firstName: 'Test',
  lastName: 'User',
  dob: new Date('2000-01-01'),
  createdAt: new Date(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(mockAuthService as AuthService, mockLogger as Logger, mockDb as pg.Pool);
  });

  describe('confirmUser', () => {
    it('throws if email missing', async () => {
      await expect(service.confirmUser('')).rejects.toThrow();
    });
    it('throws if email invalid', async () => {
      (validateEmail as jest.Mock).mockReturnValue(false);
      await expect(service.confirmUser('bad')).rejects.toThrow();
    });
    it('throws if user not found', async () => {
      (validateEmail as jest.Mock).mockReturnValue(true);
      jest.spyOn(mockDb, 'query').mockResolvedValue({ rows: [] });
      await expect(service.confirmUser('test@example.com')).rejects.toThrow();
    });
    it('returns user if found', async () => {
      (validateEmail as jest.Mock).mockReturnValue(true);
      jest.spyOn(mockDb, 'query').mockResolvedValue({ rows: [user] });
      await expect(service.confirmUser('test@example.com')).resolves.toEqual(user);
    });
  });

  describe('addUser', () => {
    it('throws if validation fails (email)', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      (validate as jest.Mock).mockResolvedValue([{ property: 'email' }]);
      await expect(service.addUser(user as User, 'cid')).rejects.toThrow();
    });
    it('throws if validation fails (firstName/lastName)', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      (validate as jest.Mock).mockResolvedValue([{ property: 'firstName' }]);
      await expect(service.addUser(user as User, 'cid')).rejects.toThrow();
    });
    it('throws if user already exists', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      (validate as jest.Mock).mockResolvedValue([]);
      mockDb.query.mockResolvedValueOnce({ rows: [user] }); // existing user
      await expect(service.addUser(user, 'cid')).rejects.toThrow();
    });
    it('creates user and returns AuthToken', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      (validate as jest.Mock).mockResolvedValue([]);
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // not existing
        .mockResolvedValueOnce({ rows: [user] }); // insert
      jest.spyOn(mockAuthService, 'createNewJwt').mockResolvedValue({ bearerToken: 'b', refreshToken: 'r' });
      await expect(service.addUser(user, 'cid')).resolves.toEqual({ bearerToken: 'b', refreshToken: 'r' });
    });
  });

  describe('removeUser', () => {
    it('throws if user not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      await expect(service.removeUser('id', 'pw', 'cid')).rejects.toThrow();
    });
    it('throws if password does not match', async () => {
      mockDb.query.mockResolvedValue({ rows: [user] });
      jest.spyOn(mockAuthService, 'passwordMatch').mockResolvedValue(false);
      await expect(service.removeUser('id', 'pw', 'cid')).rejects.toThrow();
    });
    it('removes user if password matches', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [user] }).mockResolvedValueOnce({ rows: [user] });
      jest.spyOn(mockAuthService, 'passwordMatch').mockResolvedValue(true);
      await expect(service.removeUser('id', 'pw', 'cid')).resolves.toEqual(user);
    });
  });

  describe('getUser', () => {
    it('throws if user not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      await expect(service.getUser('id')).rejects.toThrow();
    });
    it('returns user if found', async () => {
      mockDb.query.mockResolvedValue({ rows: [user] });
      await expect(service.getUser('id')).resolves.toEqual(user);
    });
  });

  describe('updatePassword', () => {
    it('throws if user not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      await expect(service.updatePassword('id', 'old', 'new', 'cid')).rejects.toThrow();
    });
    it('throws if password does not match', async () => {
      mockDb.query.mockResolvedValue({ rows: [user] });
      jest.spyOn(mockAuthService, 'passwordMatch').mockResolvedValue(false);
      await expect(service.updatePassword('id', 'old', 'new', 'cid')).rejects.toThrow();
    });
    it('throws if hash fails', async () => {
      mockDb.query.mockResolvedValue({ rows: [user] });
      jest.spyOn(mockAuthService, 'passwordMatch').mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.updatePassword('id', 'old', 'new', 'cid')).rejects.toThrow();
    });
    it('updates password if validation passes', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [user] }).mockResolvedValueOnce({ rows: [user] });
      jest.spyOn(mockAuthService, 'passwordMatch').mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      await expect(service.updatePassword('id', 'old', 'Th1sIs@Test', 'cid')).resolves.toEqual(user);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for valid password', () => {
      expect(service.verifyPassword('Abcdef1!')).toBe(true);
    });
    it('returns false for invalid password', () => {
      expect(service.verifyPassword('short')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('throws if password does not meet requirements', async () => {
      jest.spyOn(service, 'verifyPassword').mockReturnValue(false);
      await expect(service.hashPassword('bad')).rejects.toThrow();
    });
    it('returns hash if password valid', async () => {
      jest.spyOn(service, 'verifyPassword').mockReturnValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed');
      await expect(service.hashPassword('GoodPass1!')).resolves.toBe('hashed');
    });
    it('throws if argon2.hash fails', async () => {
      jest.spyOn(service, 'verifyPassword').mockReturnValue(true);
      (argon2.hash as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(service.hashPassword('GoodPass1!')).rejects.toThrow();
    });
  });
});
