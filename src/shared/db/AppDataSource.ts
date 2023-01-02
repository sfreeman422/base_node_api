import { DataSource } from 'typeorm';
import { Logger } from '../services/logger/logger.service';
import { SecretServiceEnum } from '../services/secret/secret.interface';
import { SecretService } from '../services/secret/secret.service';
import { SampleModel } from './models/SampleModel';

let AppDataSource: Promise<DataSource>;

const logger = new Logger('AppDataSource');

const secretService = new SecretService(process.env.PRODUCTION ? SecretServiceEnum.AWS : SecretServiceEnum.LOCAL);

const getDBSecrets = () => {
  return secretService
    .getDataSourceOptions()
    .then((dbSecrets) => {
      if (dbSecrets) {
        const isEnvironmentDefined = !!(
          dbSecrets.username &&
          dbSecrets.password &&
          dbSecrets.host &&
          dbSecrets.port &&
          dbSecrets.database &&
          dbSecrets.synchronize &&
          dbSecrets.type
        );

        if (!isEnvironmentDefined) {
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
      entities: [SampleModel],
      synchronize: secrets.synchronize,
      logging: false,
    }).initialize();

    return AppDataSource;
  }
};
