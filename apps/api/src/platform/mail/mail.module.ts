import { Module } from '@nestjs/common';
import { ENVIRONMENT, type Environment } from '../config/environment.js';
import { MAIL_SENDER } from './mail-sender.js';
import { ConsoleMailSender } from './console-mail-sender.js';
import { ResendMailSender } from './resend-mail-sender.js';

@Module({
  providers: [
    ConsoleMailSender,
    ResendMailSender,
    {
      provide: MAIL_SENDER,
      inject: [ENVIRONMENT, ConsoleMailSender, ResendMailSender],
      useFactory: (environment: Environment, fallback: ConsoleMailSender, resend: ResendMailSender) =>
        environment.resendApiKey ? resend : fallback,
    },
  ],
  exports: [MAIL_SENDER],
})
export class MailModule {}
