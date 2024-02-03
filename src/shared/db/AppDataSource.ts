import { DataSource } from 'typeorm';
import { Logger } from '../services/logger/logger.service';
import { entities } from './entities';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

let AppDataSource: Promise<DataSource>;

const logger = new Logger('AppDataSource');

export const getDataSource = async (): Promise<DataSource> => {
  if (AppDataSource) {
    return AppDataSource;
  } else {
    logger.info('No existing data source found, creating...');
    AppDataSource = new DataSource({
      type: process.env.type,
      host: process.env.host,
      port: process.env.dbport,
      username: process.env.username,
      password: process.env.password,
      database: process.env.database,
      entities: entities,
      synchronize: process.env.synchronize,
      logging: true,
    } as PostgresConnectionOptions).initialize();

    return AppDataSource;
  }
};
