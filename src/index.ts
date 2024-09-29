import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import { controllers } from './controllers/index.controller';
import { Logger } from './shared/services/logger/logger.service';
import { createPool } from './shared/db/DbPool';
import { correlationIdMiddleWare } from './shared/middleware/correlationId.middleware';

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
app.use(correlationIdMiddleWare);
app.use(controllers);

app.listen(PORT, (e?: Error) => {
  if (e) {
    logger.error(e.message);
  } else {
    logger.info(`Listening on port ${PORT}`);
    createPool();
  }
});
