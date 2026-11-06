import { describe, expect, it } from 'vitest';
import { InMemoryMailer } from '../adapters/mail/InMemoryMailer.js';
import { ValidationError } from '../domain/errors.js';
import { silentLogger } from '../lib/logger.js';
import { InMemoryProductRepository } from '../test-support/fixtures.js';
import { EnquiryService } from './EnquiryService.js';

function setup() {
  const mailer = new InMemoryMailer();
  const service = new EnquiryService(
    new InMemoryProductRepository(),
    mailer,
    { salesInbox: 'sales@shop.test', fromAddress: 'no-reply@shop.test' },
    silentLogger,
  );
  return { mailer, service };
}

const valid = { productId: '5', name: 'Ada Lovelace', email: 'ada@example.com', message: 'Is this in stock?' };

describe('EnquiryService', () => {
  it('emails the sales inbox with the product and customer details', async () => {
    const { mailer, service } = setup();
    const receipt = await service.submit(valid);

    expect(receipt.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(mailer.sent).toHaveLength(1);
    const email = mailer.sent[0]!;
    expect(email.to).toBe('sales@shop.test');
    expect(email.from).toBe('no-reply@shop.test');
    expect(email.replyTo).toBe('ada@example.com');
    expect(email.subject).toBe('New enquiry: Dragon Bracelet');
    expect(email.text).toContain('Ada Lovelace');
    expect(email.text).toContain('Is this in stock?');
    expect(email.text).toContain(receipt.reference);
  });

  it('uses the product title from the catalogue, not from the client', async () => {
    const { mailer, service } = setup();
    await service.submit({ ...valid, productTitle: 'FREE MONEY' });
    expect(mailer.sent[0]!.subject).toBe('New enquiry: Dragon Bracelet');
  });

  it('rejects invalid input without sending email', async () => {
    const { mailer, service } = setup();
    await expect(service.submit({ ...valid, email: 'nope' })).rejects.toBeInstanceOf(ValidationError);
    expect(mailer.sent).toHaveLength(0);
  });

  it('rejects enquiries for products that do not exist', async () => {
    const { mailer, service } = setup();
    await expect(service.submit({ ...valid, productId: '999' })).rejects.toBeInstanceOf(ValidationError);
    expect(mailer.sent).toHaveLength(0);
  });

  it('silently drops honeypot submissions', async () => {
    const { mailer, service } = setup();
    const receipt = await service.submit({ ...valid, website: 'http://spam.example' });
    expect(receipt.reference).toMatch(/^[0-9a-f-]{36}$/);
    expect(mailer.sent).toHaveLength(0);
  });

  it('propagates mailer failures so the customer is not told it worked', async () => {
    const { mailer, service } = setup();
    mailer.failWith = new Error('SMTP down');
    await expect(service.submit(valid)).rejects.toThrow('SMTP down');
  });
});
