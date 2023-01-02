import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { Logger } from '../services/logger/logger.service';
import { SecretServiceEnum } from '../services/secret/secret.enum';
import { SecretService } from '../services/secret/secret.service';
import { entities } from './entities';

let AppDataSource: Promise<DataSource>;

const logger = new Logger('AppDataSource');

const secretService = new SecretService(process.env.PRODUCTION ? SecretServiceEnum.AWS : SecretServiceEnum.LOCAL);

const isEnvironmentDefined = (dbSecrets: MysqlConnectionOptions) =>
  !!(
    dbSecrets.username &&
    dbSecrets.password &&
    dbSecrets.host &&
    dbSecrets.port &&
    dbSecrets.database &&
    dbSecrets.synchronize &&
    dbSecrets.type
  );

const getDBSecrets = () => {
  return secretService
    .getDataSourceOptions()
    .then((dbSecrets) => {
      if (dbSecrets) {
        if (!isEnvironmentDefined(dbSecrets)) {
          throw new Error('Missing dbSecrets!');
        }
        return dbSecrets;
      }
      throw new Error('Missing DataSourceOptions!');
    })
    .catch((e) => {
      logger.error('Error on secretService.getDataSourceOptions()', { error: e });
      throw new Error(e);
    });
};

export const getDataSource = async (): Promise<DataSource> => {
  const secrets = await getDBSecrets();

  if (AppDataSource) {
    return AppDataSource;
  } else {
    AppDataSource = new DataSource({
      type: secrets.type,
      host: secrets.host,
      port: secrets.port,
      username: secrets.username,
      password: secrets.password,
      database: secrets.database,
      entities: entities,
      synchronize: secrets.synchronize,
      logging: false,
    }).initialize();

    return AppDataSource;
  }
};
