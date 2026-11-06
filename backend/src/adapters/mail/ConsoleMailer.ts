import type { Logger } from '../../ports/Logger.js';
import type { EmailMessage, Mailer } from '../../ports/Mailer.js';

/** For running without any mail server: logs the email instead of sending it. */
export class ConsoleMailer implements Mailer {
  constructor(private readonly logger: Logger) {}

  async send(message: EmailMessage): Promise<void> {
    this.logger.info('Email (console transport, not sent)', { ...message });
  }
}
