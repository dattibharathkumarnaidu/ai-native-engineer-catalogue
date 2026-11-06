import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailMessage, Mailer } from '../../ports/Mailer.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

/** Works with Mailpit locally and with any SMTP provider (incl. Amazon SES SMTP) in prod. */
export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(options: SmtpOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      ...(options.user ? { auth: { user: options.user, pass: options.pass } } : {}),
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail(message);
  }
}
