import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class Logger {
  private logger: WinstonLogger;

  constructor(label: string) {
    this.logger = createLogger({
      level: 'http',
      format: format.combine(format.label({ label }), format.timestamp(), format.json(), format.prettyPrint()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, meta?: Record<any, any>): void {
    this.log('debug', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, meta?: Record<any, any>): void {
    this.log('info', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, meta?: Record<any, any>): void {
    this.log('warn', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, meta?: Record<any, any>): void {
    this.log('error', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  http(message: string, meta?: Record<any, any>): void {
    this.log('http', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: string, message: string, meta?: Record<any, any>): void {
    meta ? this.logger.log(level, message, { meta }) : this.logger.log(level, message);
  }
}
