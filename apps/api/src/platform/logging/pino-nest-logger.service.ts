import type { LoggerService } from '@nestjs/common';
import type { FastifyBaseLogger } from 'fastify';

// Routes Nest's own log calls (app.get(Logger), new Logger(context).log(...),
// Nest's internal bootstrap/lifecycle messages) through the same pino
// instance Fastify uses for request logging, so every log line — HTTP
// access logs and application logs alike — lands in one structured JSON
// stream instead of Nest's separate colorized console logger.
export class PinoNestLoggerService implements LoggerService {
  constructor(private readonly pino: FastifyBaseLogger) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  private write(level: 'info' | 'error' | 'warn' | 'debug' | 'trace' | 'fatal', message: unknown, optionalParams: unknown[]): void {
    const context = typeof optionalParams[optionalParams.length - 1] === 'string' ? optionalParams[optionalParams.length - 1] : undefined;
    this.pino[level]({ context }, typeof message === 'string' ? message : JSON.stringify(message));
  }
}
