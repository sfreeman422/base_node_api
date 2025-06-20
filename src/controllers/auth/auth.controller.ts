import express, { Router } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import {
  invalidPasswordMessage,
  unableToFindUser,
  missingFieldsMessage,
  invalidEmailMessage,
} from '../../shared/constants/message.constants';
import { Logger } from '../../shared/services/logger/logger.service';
import { generateError } from '../../shared/utils/generateError';
import { generateResponse } from '../../shared/utils/generateResponse';
import { validateEmail } from '../../shared/utils/validateEmail';
import { AuthService, AuthToken } from '../../shared/services/auth/auth.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { unauthorizedMessage } from '../../shared/middleware/middleware.messages';
import { unableToEncodeTokenMessage } from '../../shared/services/auth/constants/auth.messages';

export const authController: Router = express.Router();

const authService = new AuthService();
const logger = new Logger('authController');

authController.post('/login', (req, res) => {
  const { correlationId } = req.body.middleware;
  logger.info('POST - /login - Initiate', { req: req.body.email, correlationId });
  if (!req.body.email || !req.body.password) {
    res.status(400).send(generateError(missingFieldsMessage, correlationId));
  } else if (!validateEmail(req.body.email)) {
    res.status(400).send(generateError(invalidEmailMessage, correlationId));
  } else {
    authService
      .login(req.body.email, req.body.password, correlationId)
      .then((token: AuthToken) => {
        logger.info('POST - /login - Success', { req: req.body.email, correlationId });
        res.status(200).send(generateResponse(token, correlationId));
      })
      .catch((e: Error) => {
        logger.error('POST - /login - Error', { error: e, correlationId });
        const errorResponse = generateError(e.message, correlationId);
        if (e.message === invalidPasswordMessage) {
          res.status(400).send(errorResponse);
        } else if (e.message === unableToFindUser) {
          res.status(404).send(errorResponse);
        } else {
          res.status(500).send(errorResponse);
        }
      });
  }
});

// Sort of a dummy route - allows users to confirm that a jwt is valid. If the middleware passes and we make it here, we know it is valid.
authController.post('/verify', authMiddleware, (_req, res) => {
  res.status(200).send();
});

authController.post('/refresh', (req, res) => {
  const correlationId = req.body?.middleware.correlationId;

  if (!req.headers.authorization) {
    res.status(401).send(generateError(unauthorizedMessage, correlationId));
  } else {
    logger.info('Attempting to refresh token', { correlationId });
    authService
      .confirmJwt(req.headers.authorization.split(' ')[1])
      .then((info: string | JwtPayload | undefined) => {
        return (info as JwtPayload['user']).user;
      })
      .then((user) => {
        authService.refreshJwt(user, correlationId).then((token: AuthToken) => {
          if (token) {
            res.status(200).send(generateResponse(token, correlationId));
          } else {
            res.status(500).send(generateError(unableToEncodeTokenMessage, correlationId));
          }
        });
      })
      .catch((e) => {
        logger.error(e.message, { error: e, correlationId });
        res.status(500).send(generateError(e.message, correlationId));
      });
  }
});

// Not implemented yet.
authController.post('/forgot-password', (_req, res) => {
  res.status(200).send({ data: 'Not implemented yet.' });
  // const { correlationId } = req.body.middleware;
  // logger.info('POST - /forgot-password - Initiate', { correlationId });

  // if (!req.body.email) {
  //   logger.error('POST - /forgot-password - Failure', { error: missingFieldsMessage, correlationId });
  //   res.status(400).send({ data: missingFieldsMessage });
  // } else {
  //   authService
  //     .resetPassword(req.body.email, correlationId)
  //     .then((result: string) => {
  //       logger.info('POST - /forgot-password - Success', { correlationId });
  //       res.send({ data: result });
  //     })
  //     .catch((e: Error) => {
  //       logger.error('POST - /forgot-password - Failure', { error: e, correlationId });
  //       if (e.message === unableToFindUser) {
  //         res.status(404).send({ data: e.message });
  //       } else {
  //         res.status(500).send({ data: e.message });
  //       }
  //     });
  // }
});
