import { Global, Module } from '@nestjs/common';
import { type Environment, parseEnvironment } from './environment.js';

export const ENVIRONMENT = Symbol('ENVIRONMENT');

@Global()
@Module({
  providers: [
    {
      provide: ENVIRONMENT,
      useFactory: (): Environment => {
        const raw = {
          NODE_ENV: process.env.NODE_ENV ?? 'development',
          DATABASE_URL:
            process.env.DATABASE_URL ??
            'postgresql://aletheia:aletheia_dev_secret@127.0.0.1:5432/aletheia?schema=public',
          ...process.env,
        };
        return parseEnvironment(raw);
      },
    },
  ],
  exports: [ENVIRONMENT],
})
export class ConfigModule {}
