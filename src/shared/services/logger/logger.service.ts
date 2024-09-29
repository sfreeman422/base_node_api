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

  debug(message: string, meta?: Record<string | number | symbol, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string | number | symbol, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string | number | symbol, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string | number | symbol, unknown>): void {
    this.log('error', message, meta);
  }

  http(message: string, meta?: Record<string | number | symbol, unknown>): void {
    this.log('http', message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private log(level: string, message: string, meta?: Record<any, any>): void {
    if (meta) {
      this.logger.log(level, message, { meta });
    } else {
      this.logger.log(level, message);
    }
  }
}
