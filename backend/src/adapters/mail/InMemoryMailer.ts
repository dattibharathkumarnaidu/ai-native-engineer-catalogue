import type { EmailMessage, Mailer } from '../../ports/Mailer.js';

/** Test double: records messages; can be told to fail. */
export class InMemoryMailer implements Mailer {
  readonly sent: EmailMessage[] = [];
  failWith: Error | undefined;

  async send(message: EmailMessage): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(message);
  }
}
