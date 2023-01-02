import { GetSecretValueCommandOutput, SecretsManager } from '@aws-sdk/client-secrets-manager';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { RedisService } from '../redis/redis.service';
import { LocalSecretManager } from './local-secret.service';
import { dbSecretsKey, secretTTL, serviceSecretsKey } from './secret.constants';
import { SecretServiceEnum } from './secret.enum';
import { DBSecret, ServiceSecret } from './secret.interface';

export class SecretService {
  private static instance: SecretService;
  public readonly serviceType: SecretServiceEnum;
  private secretManager: SecretsManager | LocalSecretManager;
  private redis = RedisService.getInstance();

  public static getInstance(serviceType: SecretServiceEnum): SecretService {
    if (serviceType === SecretServiceEnum.AWS) {
      if (!SecretService.instance) {
        SecretService.instance = new SecretService(serviceType);
      }
      return SecretService.instance;
    } else if (serviceType === SecretServiceEnum.LOCAL) {
      if (!SecretService.instance) {
        SecretService.instance = new SecretService(serviceType);
      }
      return SecretService.instance;
    } else {
      throw new Error(`Unable to create SecretService with serviceType of ${serviceType}`);
    }
  }

  constructor(serviceType: SecretServiceEnum) {
    this.serviceType = serviceType;
    this.secretManager = serviceType === 'AWS' ? new SecretsManager({ region: 'us-east-1' }) : new LocalSecretManager();
  }

  async getServiceSecrets(): Promise<ServiceSecret | undefined> {
    const serviceSecrets = await this.redis.getValue(serviceSecretsKey).then((x) => {
      if (x) {
        return JSON.parse(x) as ServiceSecret;
      }
      return null;
    });

    if (serviceSecrets) {
      return serviceSecrets;
    }

    return this.getSecret(serviceSecretsKey)
      .then(async (secret: string) => {
        const secretJson: ServiceSecret = JSON.parse(secret);
        await this.redis.setValueWithExpireSeconds(serviceSecretsKey, JSON.stringify(secretJson), secretTTL);
        return secretJson as ServiceSecret;
      })
      .catch((e: Error) => {
        throw e;
      });
  }

  async getDataSourceOptions(): Promise<MysqlConnectionOptions | undefined> {
    const dbSecrets = await this.redis.getValue(dbSecretsKey).then((x) => {
      if (x) {
        return JSON.parse(x) as MysqlConnectionOptions;
      }
      return null;
    });

    if (dbSecrets) {
      return dbSecrets;
    }

    return await this.getSecret(dbSecretsKey)
      .then(async (secret: string) => {
        const secretJson: DBSecret = JSON.parse(secret);
        const dataSourceOptions: MysqlConnectionOptions = {
          username: secretJson.username,
          password: secretJson.password,
          type: secretJson.type as any,
          host: secretJson.host,
          port: Number(secretJson.port),
          synchronize: secretJson.synchronize,
          database: secretJson.dbInstanceIdentifier,
        };
        await this.redis.setValueWithExpireSeconds(dbSecretsKey, JSON.stringify(dataSourceOptions), secretTTL);
        return dataSourceOptions;
      })
      .catch((e: Error) => {
        throw e;
      });
  }

  private async getSecret(secretId: string): Promise<string> {
    return this.secretManager.getSecretValue({ SecretId: secretId }).then((secret: GetSecretValueCommandOutput) => {
      if (secret.SecretString) {
        return secret.SecretString;
      } else {
        throw new Error(`Unable to retrieve secret values for ${secretId}`);
      }
    });
  }
}
