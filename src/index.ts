import 'reflect-metadata'; // Necessary for TypeORM entities.
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import { controllers } from './controllers/index.controller';
import { getDataSource } from './shared/db/AppDataSource';
import { Logger } from './shared/services/logger/logger.service';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const logger = new Logger('index');

if (!process.env.PRODUCTION) {
  dotenv.config();
}

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());
app.use(controllers);

const connectToDb = (): Promise<void> => {
  return getDataSource().then((datasource) => {
    if (datasource.isInitialized) {
      logger.info(`Connected to MySQL DB: ${datasource.options.database}`);
    } else {
      throw Error('Unable to connect to database');
    }
  });
};

app.listen(PORT, (e?: Error) => {
  e ? logger.error(e.message) : logger.info('Listening on port 3000');
  connectToDb();
});
