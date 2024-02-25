import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

export const correlationIdMiddleWare = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = uuid();
  req.body.middleware = { ...req.body.middleware, correlationId };
  res.set('correlationId', correlationId);
  next();
};
