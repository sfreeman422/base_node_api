import { GetSecretValueCommandInput, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';
import { Logger } from '../logger/logger.service';

export class LocalSecretManager {
  private logger = new Logger('localSecretManager');

  getSecretValue(localSecret: GetSecretValueCommandInput): Promise<GetSecretValueCommandOutput> {
    this.logger.info('Attempting to retrieve secrets from environment variables');
    return new Promise((resolve, reject) => {
      if (localSecret.SecretId && !process.env[localSecret.SecretId]) {
        this.logger.info(`Secret: ${localSecret.SecretId} was not found/defined.`);
        reject(`${localSecret.SecretId} was not found/defined.`);
      } else {
        resolve({
          Name: localSecret.SecretId,
          SecretString: localSecret.SecretId ? process.env[localSecret.SecretId] : undefined,
        } as GetSecretValueCommandOutput);
      }
    });
  }
}
