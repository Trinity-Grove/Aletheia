import { Injectable, Logger } from '@nestjs/common';
import type { MailMessage, MailSender } from './mail-sender.js';

// Used whenever RESEND_API_KEY isn't configured (local dev, CI, or simply
// before a real provider has been wired up). Nothing is actually sent —
// the message is logged so the link/token inside it is still usable
// during manual testing.
@Injectable()
export class ConsoleMailSender implements MailSender {
  private readonly logger = new Logger(ConsoleMailSender.name);

  async send(message: MailMessage): Promise<void> {
    this.logger.warn(
      `RESEND_API_KEY is not configured — logging email instead of sending it.\n` +
        `To: ${message.to}\nSubject: ${message.subject}\n${message.text}`,
    );
  }
}
