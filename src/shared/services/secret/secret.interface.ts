export interface ServiceSecret {
  MOODLY_ME_PRIVATE_KEY?: string;
}

export interface DBSecret {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: string;
  dbInstanceIdentifier: string;
  synchronize: boolean;
  type: string;
}
