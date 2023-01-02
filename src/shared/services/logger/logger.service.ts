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

  debug(message: string, meta?: Record<any, any>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<any, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<any, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<any, any>): void {
    this.log('error', message, meta);
  }

  private log(level: string, message: string, meta?: Record<any, any>): void {
    meta ? this.logger.log(level, message, { meta }) : this.logger.log(level, message);
  }
}
