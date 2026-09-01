import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENVIRONMENT, type Environment } from '../config/environment.js';
import type { MailMessage, MailSender } from './mail-sender.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class ResendMailSender implements MailSender {
  private readonly logger = new Logger(ResendMailSender.name);

  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.environment.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.environment.mailFromAddress,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Resend API responded with ${response.status}: ${body}`);
    }
  }
}
