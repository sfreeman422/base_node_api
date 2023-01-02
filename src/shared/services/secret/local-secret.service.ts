import { GetSecretValueCommandInput, GetSecretValueCommandOutput } from '@aws-sdk/client-secrets-manager';

export class LocalSecretManager {
  getSecretValue(localSecret: GetSecretValueCommandInput): Promise<GetSecretValueCommandOutput> {
    return new Promise((resolve, reject) => {
      if (localSecret.SecretId && !process.env[localSecret.SecretId]) {
        reject(`${localSecret.SecretId} is not defined.`);
      } else {
        resolve({
          Name: localSecret.SecretId,
          SecretString: localSecret.SecretId ? process.env[localSecret.SecretId] : undefined,
        } as GetSecretValueCommandOutput);
      }
    });
  }
}
