import request from 'supertest';
import express, { Request as Req, Response, NextFunction } from 'express';
import { userController } from './user.controller';
import { UserService } from '../../shared/services/user/user.service';
import * as generateResponseModule from '../../shared/utils/generateResponse';
import * as generateErrorModule from '../../shared/utils/generateError';
import { badRequestMessage, missingFieldsMessage, unableToFindUser } from '../../shared/constants/message.constants';
import { passwordMismatchMessage } from '../../shared/services/user/constants/user.messages';

jest.mock('../../shared/services/user/user.service');
jest.mock('../../shared/services/logger/logger.service');
jest.mock('../../shared/utils/generateResponse');
jest.mock('../../shared/utils/generateError');
jest.mock('../../shared/middleware/auth.middleware', () => ({
  authMiddleware: (_req: Req, _res: Response, next: NextFunction) => next(),
}));

const app = express();
app.use(express.json());
app.use('/user', userController);

const mockUser = {
  id: 'id',
  email: 'test@example.com',
  password: 'hashed',
  firstName: 'Test',
  lastName: 'User',
  dob: '2000-01-01',
};
const mockToken = { bearerToken: 'bearer', refreshToken: 'refresh' };
const mockGenerateResponse = jest.fn((data, cid) => ({ data, cid }));
const mockGenerateError = jest.fn((msg, cid) => ({ error: msg, cid }));

beforeEach(() => {
  jest.clearAllMocks();
  (generateResponseModule.generateResponse as jest.Mock).mockImplementation(mockGenerateResponse);
  (generateErrorModule.generateError as jest.Mock).mockImplementation(mockGenerateError);
});

describe('userController', () => {
  describe('POST /user', () => {
    it('200 on success', async () => {
      (UserService.prototype.addUser as jest.Mock).mockResolvedValue(mockToken);
      const res = await request(app)
        .post('/user/user')
        .send({ ...mockUser, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockToken);
    });

    it('400 on missing data (errno 1364)', async () => {
      (UserService.prototype.addUser as jest.Mock).mockRejectedValue({ errno: 1364, sqlMessage: 'Missing' });
      const res = await request(app)
        .post('/user/user')
        .send({ ...mockUser, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing');
    });

    it('409 on duplicate (errno 1062)', async () => {
      (UserService.prototype.addUser as jest.Mock).mockRejectedValue({ errno: 1062, sqlMessage: 'Duplicate' });
      const res = await request(app)
        .post('/user/user')
        .send({ ...mockUser, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Duplicate');
    });

    it('400 on badRequestMessages', async () => {
      (UserService.prototype.addUser as jest.Mock).mockRejectedValue({ message: badRequestMessage });
      const res = await request(app)
        .post('/user/user')
        .send({ ...mockUser, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(400);
    });

    it('500 on other errors', async () => {
      (UserService.prototype.addUser as jest.Mock).mockRejectedValue({ message: 'Other', sqlMessage: 'OtherSQL' });
      const res = await request(app)
        .post('/user/user')
        .send({ ...mockUser, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('OtherSQL');
    });
  });

  describe('POST /user/confirm', () => {
    it('200 on success', async () => {
      (UserService.prototype.confirmUser as jest.Mock).mockResolvedValue(mockUser);
      const res = await request(app)
        .post('/user/user/confirm')
        .send({ email: mockUser.email, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockUser);
    });

    it('404 if unableToFindUser', async () => {
      (UserService.prototype.confirmUser as jest.Mock).mockRejectedValue({ message: unableToFindUser });
      const res = await request(app)
        .post('/user/user/confirm')
        .send({ email: mockUser.email, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(404);
    });

    it('400 if missingFieldsMessage', async () => {
      (UserService.prototype.confirmUser as jest.Mock).mockRejectedValue({ message: missingFieldsMessage });
      const res = await request(app)
        .post('/user/user/confirm')
        .send({ email: mockUser.email, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(400);
    });

    it('500 on other errors', async () => {
      (UserService.prototype.confirmUser as jest.Mock).mockRejectedValue({ message: 'Other', sqlMessage: 'OtherSQL' });
      const res = await request(app)
        .post('/user/user/confirm')
        .send({ email: mockUser.email, middleware: { correlationId: 'cid' } });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('OtherSQL');
    });
  });

  describe('DELETE /user', () => {
    it('200 on success', async () => {
      (UserService.prototype.removeUser as jest.Mock).mockResolvedValue({});
      const res = await request(app)
        .delete('/user/user')
        .send({ password: 'pw', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toBe('Successfully removed user.');
    });

    it('404 if unableToFindUser', async () => {
      (UserService.prototype.removeUser as jest.Mock).mockRejectedValue(new Error(unableToFindUser));
      const res = await request(app)
        .delete('/user/user')
        .send({ password: 'pw', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(404);
    });

    it('400 if passwordMismatchMessage', async () => {
      (UserService.prototype.removeUser as jest.Mock).mockRejectedValue(new Error(passwordMismatchMessage));
      const res = await request(app)
        .delete('/user/user')
        .send({ password: 'pw', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(400);
    });

    it('500 on other errors', async () => {
      (UserService.prototype.removeUser as jest.Mock).mockRejectedValue(new Error('Other'));
      const res = await request(app)
        .delete('/user/user')
        .send({ password: 'pw', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(500);
    });
  });

  describe('PUT /password', () => {
    it('400 if missing oldPassword', async () => {
      const res = await request(app)
        .put('/user/password')
        .send({ password: 'new', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(400);
    });

    it('400 if missing password', async () => {
      const res = await request(app)
        .put('/user/password')
        .send({ oldPassword: 'old', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(400);
    });

    it('200 on success', async () => {
      (UserService.prototype.updatePassword as jest.Mock).mockResolvedValue(mockUser);
      const res = await request(app)
        .put('/user/password')
        .send({ oldPassword: 'old', password: 'new', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toBe('Successfully updated password');
    });

    it('500 if updatePassword returns falsy', async () => {
      (UserService.prototype.updatePassword as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .put('/user/password')
        .send({ oldPassword: 'old', password: 'new', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(500);
    });

    it('500 on error', async () => {
      (UserService.prototype.updatePassword as jest.Mock).mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .put('/user/password')
        .send({ oldPassword: 'old', password: 'new', middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(500);
    });
  });

  describe('GET /user', () => {
    it('200 on success', async () => {
      (UserService.prototype.getUser as jest.Mock).mockResolvedValue(mockUser);
      const res = await request(app)
        .get('/user/user')
        .send({ middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockUser);
    });

    it('404 if user not found', async () => {
      (UserService.prototype.getUser as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app)
        .get('/user/user')
        .send({ middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(404);
    });

    it('500 on error', async () => {
      (UserService.prototype.getUser as jest.Mock).mockRejectedValue(new Error('fail'));
      const res = await request(app)
        .get('/user/user')
        .send({ middleware: { userId: 'id', correlationId: 'cid' } });
      expect(res.status).toBe(500);
    });
  });
});
