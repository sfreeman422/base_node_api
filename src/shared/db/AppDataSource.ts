import { DataSource } from 'typeorm';
import { SampleModel } from './models/SampleModel';

let AppDataSource: Promise<DataSource>;

const isEnvironmentDefined = () => {
  const { DB_TYPE, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;
  return !!(DB_TYPE && DB_HOST && DB_PORT && DB_USER && DB_PASSWORD && DB_DATABASE);
};

export const getDataSource = async (): Promise<DataSource> => {
  if (!isEnvironmentDefined()) {
    throw new Error('Missing Environment Variables!');
  } else if (AppDataSource) {
    return AppDataSource;
  } else {
    AppDataSource = new DataSource({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST as string,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [SampleModel],
      synchronize: true,
      logging: false,
    }).initialize();

    return AppDataSource;
  }
};
