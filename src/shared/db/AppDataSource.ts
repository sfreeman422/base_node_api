import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { Logger } from '../services/logger/logger.service';
import { entities } from './entities';

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
      driver: process.env.driver,
      logging: false,
    } as MysqlConnectionOptions).initialize();

    return AppDataSource;
  }
};
