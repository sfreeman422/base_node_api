import 'reflect-metadata'; // Necessary for TypeORM entities.
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import { controllers } from './controllers/index.controller';
import { getDataSource } from './shared/db/AppDataSource';

const app: Application = express();
const PORT = process.env.PORT || 3000;

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
      console.log(`Connected to MySQL DB: ${datasource.options.database}`);
    } else {
      throw Error('Unable to connect to database');
    }
  });
};

app.listen(PORT, (e?: Error) => {
  e ? console.error(e) : console.log('Listening on port 3000');
  connectToDb();
});
