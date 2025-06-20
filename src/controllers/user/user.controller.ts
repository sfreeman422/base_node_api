import express, { Router } from 'express';
import {
  badRequestMessages,
  unableToFindUser,
  missingFieldsMessage,
  invalidEmailMessage,
} from '../../shared/constants/message.constants';
import { Logger } from '../../shared/services/logger/logger.service';
import { generateResponse } from '../../shared/utils/generateResponse';
import { generateError } from '../../shared/utils/generateError';
import { User } from '../../shared/db/models/User/User';
import { UserService } from '../../shared/services/user/user.service';
import { AuthToken } from '../../shared/services/auth/auth.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  missingOldPasswordMessage,
  missingNewPasswordMessage,
  genericPasswordUpdateFailureMessage,
  passwordMismatchMessage,
} from '../../shared/services/user/constants/user.messages';

export const userController: Router = express.Router();

const userService = new UserService();
const logger = new Logger('userController');

userController.post('/user', (req, res) => {
  const { correlationId } = req.body.middleware;

  logger.info('POST - /user - Initiate', { req: { email: req.body.email }, correlationId });
  userService
    .addUser(req.body, correlationId)
    .then((token: AuthToken) => {
      logger.info('POST - /user - Success', { req: { email: req.body.email }, correlationId });
      res.status(200).send(generateResponse(token, correlationId));
    })
    .catch((e) => {
      logger.error('POST - /user - Failure', { req: { email: req.body.email }, error: e, correlationId });
      // Handle missing data that may have been missed by validation.
      if (e.errno === 1364) {
        logger.error('POST - /user - Failure', { error: e, correlationId });
        res.status(400).send(generateError(e.sqlMessage, correlationId));
        // Handle duplicate entry
      } else if (e.errno === 1062) {
        logger.error('POST - /user - Failure', { req: { email: req.body.email }, error: e, correlationId });
        res.status(409).send(generateError(e.sqlMessage, correlationId));
      } else if (badRequestMessages.includes(e.message)) {
        logger.error('POST - /user - Failure', { req: { email: req.body.email }, error: e, correlationId });
        res.status(400).send(generateError(e.message, correlationId));
      } else {
        logger.error('POST - /user - Failure', { req: { email: req.body.email }, error: e, correlationId });
        res.status(500).send(generateError(e.sqlMessage || e.message, correlationId));
      }
    });
});

userController.post('/user/confirm', (req, res) => {
  const { correlationId } = req.body.middleware;
  const { email } = req.body;

  logger.info('POST - /user/confirm - Initiate', { req: { email: req.body.email }, correlationId });
  userService
    .confirmUser(email)
    .then((user: User) => {
      logger.info('POST - /user/confirm - Success', { req: { user }, correlationId });
      res.status(200).send(generateResponse(user, correlationId));
    })
    .catch((e) => {
      logger.error('POST - /user/confirm - Failure', { req: { email: req.body.email }, error: e, correlationId });
      const errorResponse = generateError(e.sqlMessage || e.message, correlationId);
      if (e.message === unableToFindUser) {
        res.status(404).send(errorResponse);
      } else if (e.message === missingFieldsMessage || e.message === invalidEmailMessage) {
        res.status(400).send(errorResponse);
      } else {
        res.status(500).send(errorResponse);
      }
    });
});

userController.delete('/user', authMiddleware, async (req, res) => {
  const { correlationId } = req.body.middleware;
  logger.info('DELETE - /user - Initiate', { req: { middleware: req.body.middleware.userId }, correlationId });
  userService
    .removeUser(req.body.middleware.userId, req.body.password, correlationId)
    .then(() => {
      logger.info('DELETE - /user - Success', { req: { middleware: req.body.middleware.userId }, correlationId });
      res.send(generateResponse('Successfully removed user.', correlationId));
    })
    .catch((e: Error) => {
      if (e instanceof Error) {
        const errorResponse = generateError(e.message, correlationId);
        if (e.message === unableToFindUser) {
          logger.error('DELETE - /user - Failure', {
            req: { middleware: req.body.middleware.userId },
            correlationId,
            error: e.message,
          });

          res.status(404).send(errorResponse);
        } else if (e.message === passwordMismatchMessage) {
          logger.error('DELETE - /user - Failure', {
            req: { middleware: req.body.middleware.userId },
            correlationId,
            error: e.message,
          });

          res.status(400).send(errorResponse);
        } else {
          logger.error('DELETE - /user - Failure', {
            req: { middleware: req.body.middleware.userId },
            correlationId,
            error: e.message,
          });

          res.status(500).send(errorResponse);
        }
      }
    });
});

// userController.put('/user', authMiddleware, (req, res) => {
//   const { correlationId } = req.body.middleware;
//   logger.info('PUT - /user - Initiate', { req: { middleware: req.body.middleware.userId }, correlationId });

//   if (!req.body) {
//     logger.error('PUT - /user - Failure', {
//       req: { middleware: req.body.middleware.userId },
//       error: missingFieldsMessage,
//       correlationId,
//     });
//     res.status(400).send(generateError(missingFieldsMessage, correlationId));
//   } else if (req.body.password) {
//     logger.error('PUT - /user - Failure', {
//       req: { middleware: req.body.middleware.userId },
//       error: unableToUpdatePasswordAtThisEndpointMessage,
//       correlationId,
//     });
//     res.status(400).send(generateError(unableToUpdatePasswordAtThisEndpointMessage, correlationId));
//   } else {
//     userService
//       .updateUser(req.body.middleware.userId, req.body)
//       .then((user: User) => {
//         if (!user) {
//           logger.error('PUT - /user - Failure', {
//             req: { middleware: req.body.middleware.userId },
//             error: unableToFindUser,
//             correlationId,
//           });
//           res.status(404).send(generateError(unableToFindUser, correlationId));
//         } else {
//           logger.info('PUT - /user - Success', {
//             req: { middleware: req.body.middleware.userId },
//             correlationId,
//           });
//           res.send(generateResponse('Successfully updated user', correlationId));
//         }
//       })
//       .catch((e: Error) => {
//         logger.error('PUT - /user - Failure', {
//           req: { middleware: req.body.middleware.userId },
//           error: unableToFindUser,
//           correlationId,
//         });
//         res.status(500).send(generateError(e.message, correlationId));
//       });
//   }
// });

userController.put('/password', authMiddleware, (req, res) => {
  const { correlationId } = req.body.middleware;
  logger.info('PUT - /password - Initiate', { correlationId });

  if (!req.body.oldPassword) {
    logger.error('PUT - /password - Failure', { error: missingOldPasswordMessage, correlationId });

    res.status(400).send(generateError(missingOldPasswordMessage, correlationId));
  } else if (!req.body.password) {
    logger.error('PUT - /password - Failure', { error: missingNewPasswordMessage, correlationId });

    res.status(400).send(generateError(missingNewPasswordMessage, correlationId));
  } else {
    userService
      .updatePassword(req.body.middleware.userId, req.body.oldPassword, req.body.password, correlationId)
      .then((user: Partial<User> | undefined) => {
        if (user) {
          logger.info('PUT - /password - Success', { correlationId });

          res.send(generateResponse('Successfully updated password', correlationId));
        } else {
          logger.error('PUT - /password - Failure', { error: genericPasswordUpdateFailureMessage, correlationId });

          res.status(500).send(generateError(genericPasswordUpdateFailureMessage, correlationId));
        }
      })
      .catch((e: Error) => {
        logger.error('PUT - /password - Failure', { error: e, correlationId });

        res.status(500).send(generateError(e.message, correlationId));
      });
  }
});

userController.get('/user', authMiddleware, (req, res) => {
  const { correlationId } = req.body.middleware;
  logger.info('GET - /user - Initiate', { correlationId });

  userService
    .getUser(req.body.middleware.userId)
    .then((user: User | undefined) => {
      if (!user) {
        logger.info('GET - /user - Failure', { error: unableToFindUser, correlationId });
        res.status(404).send(generateError(unableToFindUser, correlationId));
      } else {
        logger.info('GET - /user - Success', { correlationId });
        res.send(generateResponse(user, correlationId));
      }
    })
    .catch((e: Error) => {
      logger.info('GET - /user - Failure', { error: e, correlationId });
      res.status(500).send(generateError(e.message, correlationId));
    });
});
