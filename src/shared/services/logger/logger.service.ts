import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class Logger {
  private logger: WinstonLogger;

  constructor(label: string) {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.label({ label }), format.timestamp(), format.json(), format.prettyPrint()),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(level: string, message: string, meta?: Record<any, any>): void {
    meta ? this.logger.log(level, message, { meta }) : this.logger.log(level, message);
  }

  debug(message: string, meta?: Record<any, any>): void {
    meta ? this.logger.debug(message, { meta }) : this.logger.debug(message);
  }

  info(message: string, meta?: Record<any, any>): void {
    meta ? this.logger.info(message, { meta }) : this.logger.info(message);
  }

  warn(message: string, meta?: Record<any, any>): void {
    meta ? this.logger.warn(message, { meta }) : this.logger.warn(message);
  }

  error(message: string, meta?: Record<any, any>): void {
    meta ? this.logger.error(message, { meta }) : this.logger.error(message);
  }
}
