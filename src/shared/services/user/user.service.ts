import * as argon2 from 'argon2';
import pg from 'pg';
import { AuthService, AuthToken } from '../auth/auth.service';
import { validate } from 'class-validator';
import {
  userAlreadyExists,
  unableToValidateUser,
  emailDoesNotMeetRequirements,
  unableToHashPassword,
  passwordMismatchMessage,
  passwordDoesNotMeetRequirements,
} from './user.messages';
import {
  InsertUserQuerySQL,
  RemoveUserQuerySQL,
  SelectUserByEmailQuerySQL,
  SelectUserByIdQuerySQL,
  SelectUserByIdWithPasswordQuerySQL,
  UpdateUserPasswordSql,
} from './queries.constants';
import { v4 as uuid } from 'uuid';
import {
  invalidEmailMessage,
  invalidPasswordMessage,
  missingFieldsMessage,
  unableToFindUser,
} from '../../constants/message.constants';
import { Logger } from '../logger/logger.service';
import { createOrGetPool } from '../../db/DbPool';
import { validateEmail } from '../../utils/validateEmail';
import { User } from '../../db/models/User/User';

export class UserService {
  authService: AuthService;
  logger: Logger;
  db: pg.Pool;

  constructor(authService?: AuthService, logger?: Logger, pool?: pg.Pool) {
    this.authService = authService ?? new AuthService();
    this.logger = logger ?? new Logger('UserService');
    this.db = pool ?? createOrGetPool();
  }

  public async confirmUser(email: string): Promise<User> {
    if (!email) {
      throw new Error(missingFieldsMessage);
    } else if (!validateEmail(email)) {
      throw new Error(invalidEmailMessage);
    } else {
      return this.db.query<User>(SelectUserByEmailQuerySQL, [email]).then((result) => {
        if (!result.rows.length) {
          throw new Error(unableToFindUser);
        }
        return result.rows[0];
      });
    }
  }

  public async addUser(user: User, correlationId: string): Promise<AuthToken> {
    const hashedPass = await this.hashPassword(user.password as string);
    const newUser: User = {
      ...user,
      email: user.email?.toLowerCase(),
      password: hashedPass,
    };

    const errors = await validate(newUser);

    if (errors.length) {
      this.logger.error(unableToValidateUser, { errors });
      // Add specific error message for specific failure types.
      if (errors.find((x) => x.property === 'email')) {
        throw new Error(emailDoesNotMeetRequirements);
      } else if (errors.find((x) => x.property === 'firstName' || x.property === 'lastName')) {
        throw new Error(missingFieldsMessage);
      }
      throw new Error(unableToValidateUser);
    }

    const existingUser = await this.db.query<User>(SelectUserByEmailQuerySQL, [newUser.email]).then((result) => {
      return !!result.rows[0];
    });

    if (existingUser) {
      throw new Error(userAlreadyExists);
    }

    return this.db
      .query<User>(InsertUserQuerySQL, [
        uuid(),
        newUser.email,
        newUser.password,
        newUser.firstName,
        newUser.lastName,
        newUser.dob,
      ])
      .then((result) => {
        return this.authService.createNewJwt(result.rows[0], correlationId);
      });
  }

  public removeUser(userId: string, password: string, correlationId: string): Promise<User> {
    return this.db.query<User>(SelectUserByIdWithPasswordQuerySQL, [userId]).then(async (result) => {
      if (!result.rows.length) {
        throw new Error(unableToFindUser);
      }

      const user = result.rows[0];
      const match = await this.authService.passwordMatch(password, user.password, correlationId);

      if (match) {
        return this.db.query<User>(RemoveUserQuerySQL, [userId]).then((result) => result.rows[0]);
      } else {
        throw new Error(invalidPasswordMessage);
      }
    });
  }

  // public async updateUser(userId: string, data: User): Promise<User> {
  //   const user = await AppRepo.getRepository(User).findOne({ where: { id: userId }, relations: ['tags'] });
  //   if (!user) {
  //     throw new Error(unableToFindUser);
  //   } else {
  //     const updatedUser = new User();
  //     updatedUser.id = user.id;
  //     updatedUser.email = data?.email;
  //     updatedUser.firstName = data?.firstName;
  //     updatedUser.lastName = data?.lastName;

  //     const errors = await validate(updatedUser);
  //     const canSkipThrowingError = errors.length === 1 && errors[0].property === 'password';

  //     if (errors.length && !canSkipThrowingError) {
  //       throw new Error(missingFieldsMessage);
  //     } else {
  //       return AppRepo.getRepository(User)
  //         .save(updatedUser)
  //         .then((x) => ({ ...x, password: undefined }));
  //     }
  //   }
  // }

  public getUser(userId: string): Promise<User | undefined> {
    return this.db.query<User>(SelectUserByIdQuerySQL, [userId]).then((result) => {
      if (!result.rows.length) {
        throw new Error(unableToFindUser);
      }
      return result.rows[0];
    });
  }

  public async updatePassword(
    userId: string,
    oldPassword: string,
    password: string,
    correlationId: string,
  ): Promise<User | undefined> {
    return this.db.query<User>(SelectUserByIdWithPasswordQuerySQL, [userId]).then(async (result) => {
      if (!result.rows.length) {
        throw new Error(unableToFindUser);
      }

      const user = result.rows[0];
      const match = await this.authService.passwordMatch(oldPassword, user.password, correlationId);

      if (match) {
        const hashedPassword = await this.hashPassword(password).catch((e) => {
          this.logger.error('Failure on hashPassword', { error: e });
          throw new Error(unableToHashPassword);
        });

        return this.db.query<User>(UpdateUserPasswordSql, [hashedPassword, userId]).then((result) => {
          return result.rows[0];
        });
      } else {
        throw new Error(passwordMismatchMessage);
      }
    });
  }

  /**
   * Verifies that a password is:
   
    It contains at least 8 characters.
    It contains at least one digit.
    It contains at least one upper case alphabet.
    It contains at least one lower case alphabet.
    It contains at least one special character which includes !@#$%&*()-+=^.
    It doesn’t contain any white space.
   */
  verifyPassword(password: string | undefined): boolean {
    const passwordRegex = new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*()-+])[A-Za-z0-9!@#$%^&*()-+]{8,32}$',
    );
    return !!(password && passwordRegex.test(password));
  }

  async hashPassword(password: string): Promise<string> {
    const isPasswordVerified = this.verifyPassword(password);

    if (!isPasswordVerified) {
      this.logger.error('Unable to hash password', { error: passwordDoesNotMeetRequirements });
      throw new Error(passwordDoesNotMeetRequirements);
    } else {
      return argon2.hash(password, { type: argon2.argon2id, memoryCost: 16384 }).catch((e) => {
        this.logger.error('Unable to hash password', { error: e });
        throw new Error(unableToHashPassword);
      });
    }
  }
}
