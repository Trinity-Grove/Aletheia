import { Global, Module } from '@nestjs/common';
import { type Environment, parseEnvironment } from './environment.js';

export const ENVIRONMENT = Symbol('ENVIRONMENT');

@Global()
@Module({
  providers: [
    {
      provide: ENVIRONMENT,
      useFactory: (): Environment => parseEnvironment(process.env),
    },
  ],
  exports: [ENVIRONMENT],
})
export class ConfigModule {}
