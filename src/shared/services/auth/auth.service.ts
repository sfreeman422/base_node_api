import * as argon2 from 'argon2';
import pg from 'pg';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Logger } from '../logger/logger.service';
import { createOrGetPool } from '../../db/DbPool';
import {
  invalidEmailMessage,
  invalidPasswordMessage,
  unableToCreateTokenMessage,
  unableToFindUser,
  unexpectedError,
} from '../../constants/message.constants';
import { User } from '../../db/models/User/User';
import { bearerTokenExpTime, refreshTokenExpTime } from './constants/auth.constants';
import { GetUserByEmailQuerySQL, GetUserByIdQuerySQL } from './constants/queries.constants';
import { unableToEncodeTokenMessage } from './constants/auth.messages';

export interface JwtUserInfo extends JwtPayload {
  user: string;
}

export interface AuthToken {
  bearerToken: string;
  refreshToken: string;
}

export class AuthService {
  logger: Logger;
  db: pg.Pool;

  constructor(logger?: Logger, pool?: pg.Pool) {
    this.logger = logger ?? new Logger('AuthService');
    this.db = pool ?? createOrGetPool();
  }

  public async isValidUser(userId: string): Promise<boolean> {
    return this.db
      .query<User[]>(GetUserByIdQuerySQL, [userId])
      .then((result) => {
        const { rows } = result;
        if (!rows.length) {
          this.logger.error('isValidUser()', { error: unableToFindUser, userId });
          return false;
        }
        return true;
      })
      .catch((e) => {
        this.logger.error('isValidUser()', { error: e, userId });
        throw new Error(unexpectedError);
      });
  }

  public async confirmJwt(token: string): Promise<JwtPayload | string | undefined> {
    if (process.env.AUTH_PRIVATE_KEY) {
      return new Promise((resolve, reject) => {
        jwt.verify(
          token,
          process.env.AUTH_PRIVATE_KEY as string,
          { algorithms: ['HS256'] },
          async (err, decoded: string | JwtPayload | undefined) => {
            if (err) reject(err);
            else {
              const isValid = await this.isValidUser((decoded as JwtUserInfo).user);
              if (isValid) {
                resolve(decoded);
              } else {
                reject(new jwt.JsonWebTokenError(unableToFindUser));
              }
            }
          },
        );
      });
    } else {
      throw new jwt.JsonWebTokenError(unexpectedError);
    }
  }

  public login(email: string, password: string, correlationId: string): Promise<AuthToken> {
    return this.db.query<User>(GetUserByEmailQuerySQL, [email]).then((result) => {
      const { rows } = result;
      if (!rows.length) {
        this.logger.error('login()', { error: unableToFindUser, correlationId });
        throw new Error(unableToFindUser);
      }
      const user = rows[0];
      return this.passwordMatch(password, user.password, correlationId)
        .then((passMatch: boolean) => {
          if (passMatch) {
            return this.createNewJwt(user, correlationId)
              .then((jwt) => jwt)
              .catch((e) => {
                this.logger.error('login()', { error: e, correlationId });
                throw new Error(unableToCreateTokenMessage);
              });
          } else {
            this.logger.error('login()', { error: invalidPasswordMessage, correlationId });
            throw new Error(invalidPasswordMessage);
          }
        })
        .catch((e) => {
          if (
            e.message !== invalidPasswordMessage &&
            e.message !== unableToFindUser &&
            e.message !== unableToCreateTokenMessage
          ) {
            this.logger.error('login()', { error: e, correlationId });
            throw new Error(unexpectedError);
          }
          throw e;
        });
    });
  }

  public passwordMatch(plaintext: string, hashed: string, correlationId: string): Promise<boolean> {
    return argon2.verify(hashed, plaintext).catch((e) => {
      this.logger.error('passwordMatch()', { error: e, correlationId });
      throw new Error(invalidPasswordMessage);
    });
  }

  // This is incomplete. How will we handle reset emails? Should they be assigned a temp password that they need to log in with in an alloted time
  // or should they be taken to a special reset link that only works for them.
  public resetPassword(email: string, correlationId: string): Promise<string> {
    return this.db.query<User>(GetUserByEmailQuerySQL, [email]).then((result) => {
      const { rows } = result;
      const user = rows[0];
      if (user) {
        return `Should have sent a reset email to ${user.email}`;
      } else {
        this.logger.error('resetPassword()', { error: invalidEmailMessage, correlationId });

        throw new Error('Unable to find user!');
      }
    });
  }

  public callJwtSign(userId: string, secret: string, options: jwt.SignOptions, correlationId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(
        {
          user: userId,
        },
        secret,
        options,
        (err: Error | null, encoded: string | undefined) => {
          if (err) {
            this.logger.error('callJwtSign()', { error: err, correlationId });
            reject(err);
          }
          if (!encoded) {
            this.logger.error('callJwtSign()', { error: unableToEncodeTokenMessage, correlationId });
            reject(unableToEncodeTokenMessage);
          } else {
            resolve(encoded);
          }
        },
      );
    });
  }

  public async refreshJwt(userId: string, correlationId: string): Promise<AuthToken> {
    return this.db.query<User>(GetUserByIdQuerySQL, [userId]).then((result) => {
      const { rows } = result;
      if (!rows.length) {
        throw new Error(unableToFindUser);
      } else {
        return this.createNewJwt(rows[0], correlationId);
      }
    });
  }

  public async createNewJwt(user: User, correlationId: string): Promise<AuthToken> {
    const bearerToken = await this.createNewBearerToken(user, correlationId);
    const refreshToken = await this.createNewRefreshToken(user, correlationId);
    return { bearerToken, refreshToken };
  }

  async createNewBearerToken(user: User, correlationId: string): Promise<string> {
    return this.callJwtSign(
      user.id,
      process.env.AUTH_PRIVATE_KEY as string,
      { expiresIn: bearerTokenExpTime },
      correlationId,
    ).then((encoded) => encoded);
  }

  async createNewRefreshToken(user: User, correlationId: string): Promise<string> {
    return this.callJwtSign(
      user.id,
      process.env.AUTH_PRIVATE_KEY as string,
      { expiresIn: refreshTokenExpTime },
      correlationId,
    ).then((encoded) => encoded);
  }
}
