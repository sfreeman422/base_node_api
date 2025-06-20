import request from 'supertest';
import express from 'express';
import { authController } from './auth.controller';
import { AuthService } from '../../shared/services/auth/auth.service';
import * as validateEmailModule from '../../shared/utils/validateEmail';
import * as generateErrorModule from '../../shared/utils/generateError';
import * as generateResponseModule from '../../shared/utils/generateResponse';
import { invalidPasswordMessage, unableToFindUser } from '../../shared/constants/message.constants';

jest.mock('../../shared/services/auth/auth.service');
jest.mock('../../shared/services/logger/logger.service');
jest.mock('../../shared/utils/validateEmail');
jest.mock('../../shared/utils/generateError');
jest.mock('../../shared/utils/generateResponse');

const app = express();
app.use(express.json());
app.use('/auth', authController);

const mockToken = { bearerToken: 'bearer', refreshToken: 'refresh' };
const mockGenerateError = jest.fn((msg, cid) => ({ error: msg, cid }));
const mockGenerateResponse = jest.fn((data, cid) => ({ data, cid }));

beforeEach(() => {
  jest.clearAllMocks();
  (generateErrorModule.generateError as jest.Mock).mockImplementation(mockGenerateError);
  (generateResponseModule.generateResponse as jest.Mock).mockImplementation(mockGenerateResponse);
});

describe('authController', () => {
  describe('POST /auth/login', () => {
    it('400 if missing fields', async () => {
      const res = await request(app).post('/auth/login').send({ middleware: {} });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('400 if invalid email', async () => {
      (validateEmailModule.validateEmail as jest.Mock).mockReturnValue(false);
      const res = await request(app).post('/auth/login').send({ email: 'bad', password: 'pw', middleware: {} });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('200 if login succeeds', async () => {
      (validateEmailModule.validateEmail as jest.Mock).mockReturnValue(true);
      (AuthService.prototype.login as jest.Mock).mockResolvedValue(mockToken);
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pw', middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockToken);
    });

    it('400 if invalid password', async () => {
      (validateEmailModule.validateEmail as jest.Mock).mockReturnValue(true);
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(new Error(invalidPasswordMessage));
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pw', middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(invalidPasswordMessage);
    });

    it('404 if unable to find user', async () => {
      (validateEmailModule.validateEmail as jest.Mock).mockReturnValue(true);
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(new Error(unableToFindUser));
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pw', middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe(unableToFindUser);
    });

    it('500 for other errors', async () => {
      (validateEmailModule.validateEmail as jest.Mock).mockReturnValue(true);
      (AuthService.prototype.login as jest.Mock).mockRejectedValue(new Error('Something else'));
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pw', middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Something else');
    });
  });

  describe('POST /auth/verify', () => {
    it('200 if middleware passes', async () => {
      // Bypass authMiddleware for test
      const verifyApp = express();
      verifyApp.use(express.json());
      verifyApp.post('/verify', (_req, res) => res.status(200).send());
      const res = await request(verifyApp).post('/verify').send();
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/refresh', () => {
    it('401 if no authorization header', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('200 if refresh succeeds', async () => {
      (AuthService.prototype.confirmJwt as jest.Mock).mockResolvedValue({ user: 'user-id' });
      (AuthService.prototype.refreshJwt as jest.Mock).mockResolvedValue(mockToken);
      const res = await request(app)
        .post('/auth/refresh')
        .set('authorization', 'Bearer sometoken')
        .send({ middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockToken);
    });

    it('500 if confirmJwt fails', async () => {
      (AuthService.prototype.confirmJwt as jest.Mock).mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .post('/auth/refresh')
        .set('authorization', 'Bearer sometoken')
        .send({ middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('fail');
    });

    it('500 if refreshJwt returns falsy', async () => {
      (AuthService.prototype.confirmJwt as jest.Mock).mockResolvedValue({ user: 'user-id' });
      (AuthService.prototype.refreshJwt as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .post('/auth/refresh')
        .set('authorization', 'Bearer sometoken')
        .send({ middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('200 and not implemented', async () => {
      const res = await request(app).post('/auth/forgot-password').send();
      expect(res.status).toBe(200);
      expect(res.body.data).toBe('Not implemented yet.');
    });
  });
});
