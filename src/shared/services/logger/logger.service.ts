import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';

export class Logger {
  private logger: WinstonLogger;

  constructor(label: string) {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.label({ label }),
        format.timestamp(),
        format.json(),
        format.printf(
          (info) => `[${info.level.toUpperCase()} - ${info.label.toUpperCase()} - ${info.timestamp}] ${info.message}`,
        ),
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(level: string, message: string, meta?: any[]): void {
    this.logger.log(level, message, meta);
  }

  debug(message: string, meta?: any[]): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: any[]): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any[]): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any[]): void {
    this.logger.error(message, meta);
  }
}
