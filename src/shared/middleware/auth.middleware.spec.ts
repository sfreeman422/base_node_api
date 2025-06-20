import { Request, Response, NextFunction } from 'express';

const mockConfirmJwt = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('../services/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    confirmJwt: mockConfirmJwt,
    isValidUser: jest.fn(),
  })),
}));

jest.mock('../services/logger/logger.service', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    error: mockLoggerError,
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

import { authMiddleware } from './auth.middleware';
import { unauthorizedMessage, malformedTokenMessage } from './middlware.messages';

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      headers: {},
      body: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('when authorization header is missing', () => {
    it('should return 401 unauthorized', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: unauthorizedMessage });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when authorization header is present', () => {
    beforeEach(() => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockRequest.body = {
        middleware: {
          correlationId: 'test-correlation-id',
        },
      };
    });

    it('should successfully authenticate and call next', async () => {
      const mockJwtPayload = {
        user: 'user123',
        exp: 1234567890,
        iat: 1234567890,
      };

      mockConfirmJwt.mockResolvedValue(mockJwtPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockConfirmJwt).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.body.middleware.userId).toBe('user123');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle malformed JWT token', async () => {
      const malformedError = new Error('jwt malformed');
      mockConfirmJwt.mockRejectedValue(malformedError);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('jwt malformed', {
        error: malformedError,
        correlationId: 'test-correlation-id',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: malformedTokenMessage });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle expired JWT token', async () => {
      const expiredError = new Error('jwt expired');
      mockConfirmJwt.mockRejectedValue(expiredError);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('jwt expired', {
        error: expiredError,
        correlationId: 'test-correlation-id',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: unauthorizedMessage });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle other JWT errors with 500 status', async () => {
      const genericError = new Error('Some other JWT error');
      mockConfirmJwt.mockRejectedValue(genericError);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('Some other JWT error', {
        error: genericError,
        correlationId: 'test-correlation-id',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith({ data: 'Some other JWT error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should preserve existing middleware data when adding userId', async () => {
      const mockJwtPayload = {
        user: 'user456',
        exp: 1234567890,
        iat: 1234567890,
      };

      mockRequest.body = {
        middleware: {
          correlationId: 'test-id',
          existingData: 'should-be-preserved',
        },
      };

      mockConfirmJwt.mockResolvedValue(mockJwtPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockRequest.body.middleware).toEqual({
        correlationId: 'test-id',
        existingData: 'should-be-preserved',
        userId: 'user456',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle missing correlationId gracefully', async () => {
      const genericError = new Error('Some error');
      mockRequest.body = {}; // No middleware object

      mockConfirmJwt.mockRejectedValue(genericError);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockLoggerError).toHaveBeenCalledWith('Some error', {
        error: genericError,
        correlationId: undefined,
      });
    });

    it('should extract token correctly from Bearer header', async () => {
      mockRequest.headers = {
        authorization: 'Bearer my-jwt-token-here',
      };

      const mockJwtPayload = {
        user: 'testuser',
        exp: 1234567890,
        iat: 1234567890,
      };

      mockConfirmJwt.mockResolvedValue(mockJwtPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise(process.nextTick);

      expect(mockConfirmJwt).toHaveBeenCalledWith('my-jwt-token-here');
    });
  });
});
