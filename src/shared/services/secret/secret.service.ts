import { GetSecretValueCommandOutput, SecretsManager } from '@aws-sdk/client-secrets-manager';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { LocalSecretManager } from './local-secret.service';
import { SecretServiceEnum } from './secret.enum';
import { DBSecret, ServiceSecret } from './secret.interface';

export class SecretService {
  private static awsInstance: SecretService;
  private static localInstance: SecretService;
  public readonly serviceType: SecretServiceEnum;
  private secretManager: SecretsManager | LocalSecretManager;

  public static getInstance(serviceType: SecretServiceEnum): SecretService {
    if (serviceType === SecretServiceEnum.AWS) {
      if (!SecretService.awsInstance) {
        SecretService.awsInstance = new SecretService(serviceType);
      }
      return SecretService.awsInstance;
    } else if (serviceType === SecretServiceEnum.LOCAL) {
      if (!SecretService.localInstance) {
        SecretService.localInstance = new SecretService(serviceType);
      }
      return SecretService.localInstance;
    } else {
      throw new Error(`Unable to create SecretService with serviceType of ${serviceType}`);
    }
  }

  public readonly entities? = process.env.DB_ENTITIES;
  private dataSourceOptions?: MysqlConnectionOptions;
  private serviceSecrets?: ServiceSecret;

  constructor(serviceType: SecretServiceEnum) {
    this.serviceType = serviceType;
    this.secretManager = serviceType === 'AWS' ? new SecretsManager({ region: 'us-east-1' }) : new LocalSecretManager();
  }

  async getServiceSecrets(): Promise<ServiceSecret | undefined> {
    if (this.serviceSecrets) {
      return this.serviceSecrets;
    }
    return this.getSecret('MOODLY_ME_SERVICES_SECRETS')
      .then((secret: string) => {
        const secretJson: ServiceSecret = JSON.parse(secret);
        this.serviceSecrets = secretJson; //  This should really live in redis.
        return secretJson as ServiceSecret;
      })
      .catch((e: Error) => {
        throw e;
      });
  }

  async getDataSourceOptions(): Promise<MysqlConnectionOptions | undefined> {
    if (this.dataSourceOptions) {
      return this.dataSourceOptions;
    }
    return await this.getSecret('MOODLY_ME_DB_INSTANCE')
      .then((secret: string) => {
        const secretJson: DBSecret = JSON.parse(secret);
        const dataSourceOptions: MysqlConnectionOptions = {
          username: secretJson.username,
          password: secretJson.password,
          type: secretJson.type as any,
          host: secretJson.host,
          port: Number(secretJson.port),
          synchronize: secretJson.synchronize,
          entities: [secretJson.entities],
          database: secretJson.dbInstanceIdentifier,
        };
        this.dataSourceOptions = dataSourceOptions; // This should really live in redis
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
