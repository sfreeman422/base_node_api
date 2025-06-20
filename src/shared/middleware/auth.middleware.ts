import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth/auth.service';
import { JwtPayload } from 'jsonwebtoken';
import { unauthorizedMessage, malformedTokenMessage } from './middleware.messages';
import { Logger } from '../services/logger/logger.service';

const authService = new AuthService();
const logger = new Logger('AuthMiddleware');

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.body?.middleware?.correlationId;

  if (!req.headers.authorization) {
    res.status(401).send({ error: unauthorizedMessage });
  } else {
    authService
      .confirmJwt(req.headers.authorization.split(' ')[1])
      .then((info: string | JwtPayload | undefined) => {
        req.body.middleware = {
          ...req.body.middleware,
          userId: (info as JwtPayload['user']).user,
        };
        next();
      })
      .catch((e) => {
        logger.error(e.message, { error: e, correlationId });
        if (e.message === 'jwt malformed') {
          res.status(400).send({ error: malformedTokenMessage });
        } else if (e.message === 'jwt expired') {
          res.status(401).send({ error: unauthorizedMessage });
        } else {
          res.status(500).send({ data: e.message });
        }
      });
  }
};
