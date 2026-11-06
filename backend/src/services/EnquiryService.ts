import { randomUUID } from 'node:crypto';
import { parseEnquiry, type EnquiryInput } from '../domain/enquiry.js';
import { ValidationError } from '../domain/errors.js';
import type { Product } from '../domain/product.js';
import type { Logger } from '../ports/Logger.js';
import type { Mailer } from '../ports/Mailer.js';
import type { ProductRepository } from '../ports/ProductRepository.js';

export interface EnquiryServiceOptions {
  salesInbox: string;
  fromAddress: string;
}

export interface EnquiryReceipt {
  reference: string;
}

/** Strip CR/LF so user input can never inject extra email headers. */
const headerSafe = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export class EnquiryService {
  constructor(
    private readonly products: ProductRepository,
    private readonly mailer: Mailer,
    private readonly options: EnquiryServiceOptions,
    private readonly logger: Logger,
  ) {}

  async submit(body: unknown): Promise<EnquiryReceipt> {
    const reference = randomUUID();

    // Honeypot: real users never see/fill the "website" field; bots often do.
    // Pretend success so bots get no signal.
    if (typeof body === 'object' && body !== null && (body as Record<string, unknown>).website) {
      this.logger.warn('Enquiry dropped by honeypot', { reference });
      return { reference };
    }

    const enquiry = parseEnquiry(body);
    // Never trust product details from the client — look them up ourselves.
    const product = await this.products.getById(enquiry.productId);
    if (!product) throw new ValidationError('Enquiry is invalid.', { productId: 'Product not found.' });

    await this.mailer.send({
      to: this.options.salesInbox,
      from: this.options.fromAddress,
      replyTo: headerSafe(enquiry.email),
      subject: headerSafe(`New enquiry: ${product.title}`).slice(0, 200),
      text: renderSalesEmail(enquiry, product, reference),
    });

    // Log a reference, not the customer's personal data.
    this.logger.info('Enquiry sent to sales inbox', { reference, productId: product.id });
    return { reference };
  }
}

/** Plain text on purpose: no HTML rendering means no HTML/script injection into the inbox. */
export function renderSalesEmail(enquiry: EnquiryInput, product: Product, reference: string): string {
  return [
    'A customer has enquired about a product.',
    '',
    `Product:   ${product.title} (id ${product.id})`,
    `Price:     ${product.price.amount.toFixed(2)} ${product.price.currency}`,
    '',
    `Name:      ${enquiry.name}`,
    `Email:     ${enquiry.email}`,
    `Phone:     ${enquiry.phone ?? '—'}`,
    '',
    'Message:',
    enquiry.message ?? '—',
    '',
    `Reference: ${reference}`,
    'Reply to this email to respond directly to the customer.',
  ].join('\n');
}
