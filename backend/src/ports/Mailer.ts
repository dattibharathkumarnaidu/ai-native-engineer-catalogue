export interface EmailMessage {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
}

/** Email provider boundary (SMTP today; SES, SendGrid, Postmark, etc. later). */
export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}
