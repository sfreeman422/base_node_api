import { Logger } from '../services/logger/logger.service';
import { Pool } from 'pg';

export let dbPool: Pool;

const logger = new Logger('DbPool');

export const createPool = (): Pool => {
  if (!dbPool) {
    logger.info(`Creating Pool for ${process.env.database}@${process.env.host}:${process.env.dbport}`);
    dbPool = new Pool({
      user: process.env.username,
      host: process.env.host,
      database: process.env.database,
      password: process.env.password,
      port: parseInt(process.env.dbport as string),
    });

    logger.info('Pool created successfully');
  }

  return dbPool;
};
