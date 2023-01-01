import express, { Router } from 'express';
import { Logger } from '../shared/services/logger/logger.service';
import { SampleService } from '../services/sample/sample.service';

export const sampleController: Router = express.Router();

const sampleService = new SampleService();
const logger = new Logger('SampleController');

sampleController.post('/', (req, res) => {
  logger.info('/ route hit');
  sampleService.greet(`Hello world! I received ${JSON.stringify(req.body)}`);
  res.send('Hello world!');
});
