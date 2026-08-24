import { Global, Module } from '@nestjs/common';
import * as process from 'node:process';
import { ENVIRONMENT, parseEnvironment } from './environment';

@Global()
@Module({
  providers: [
    {
      provide: ENVIRONMENT,
      useFactory: () => parseEnvironment(process.env),
    },
  ],
  exports: [ENVIRONMENT],
})
export class EnvironmentModule {}
