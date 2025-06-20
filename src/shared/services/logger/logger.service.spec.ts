import { Logger } from './logger.service';
import * as winston from 'winston';

jest.mock('winston', () => {
  const mFormat = {
    combine: jest.fn(),
    label: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
    prettyPrint: jest.fn(),
  };
  const mTransports = {
    Console: jest.fn(),
    File: jest.fn(),
  };
  return {
    createLogger: jest.fn(),
    format: mFormat,
    transports: mTransports,
  };
});

describe('Logger', () => {
  let logger: Logger;
  let mockWinstonLogger: { log: jest.Mock };

  beforeEach(() => {
    mockWinstonLogger = { log: jest.fn() };
    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);
    logger = new Logger('test-label');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each([['debug'], ['info'], ['warn'], ['error'], ['http']])('%s', (level) => {
    it(`should call winston.log with level "${level}" and message`, () => {
      logger[level]('message');
      expect(mockWinstonLogger.log).toHaveBeenCalledWith(level, 'message');
    });

    it(`should call winston.log with level "${level}", message, and meta`, () => {
      const meta = { foo: 'bar' };
      logger[level]('message', meta);
      expect(mockWinstonLogger.log).toHaveBeenCalledWith(level, 'message', { meta });
    });
  });
});
