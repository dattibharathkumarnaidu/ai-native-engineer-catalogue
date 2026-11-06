import { ValidationError } from './errors.js';

export interface EnquiryInput {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export const ENQUIRY_LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  message: 2000,
  productId: 64,
} as const;

// Deliberately pragmatic: catches typos without rejecting valid-but-unusual addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-.\s]{6,}$/;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validates and normalises untrusted input into an EnquiryInput.
 * Hand-rolled rather than a schema library to keep the domain dependency-free;
 * swap for zod/valibot if the rules grow.
 */
export function parseEnquiry(body: unknown): EnquiryInput {
  const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const productId = str(raw.productId);
  const name = str(raw.name);
  const email = str(raw.email).toLowerCase();
  const phone = str(raw.phone);
  const message = str(raw.message);

  if (!productId) fields.productId = 'Product is required.';
  else if (productId.length > ENQUIRY_LIMITS.productId) fields.productId = 'Product is invalid.';

  if (!name) fields.name = 'Please enter your name.';
  else if (name.length > ENQUIRY_LIMITS.name) fields.name = `Name must be ${ENQUIRY_LIMITS.name} characters or fewer.`;

  if (!email) fields.email = 'Please enter your email address.';
  else if (email.length > ENQUIRY_LIMITS.email || !EMAIL_PATTERN.test(email))
    fields.email = 'Please enter a valid email address.';

  if (phone && (phone.length > ENQUIRY_LIMITS.phone || !PHONE_PATTERN.test(phone)))
    fields.phone = 'Please enter a valid phone number.';

  if (message.length > ENQUIRY_LIMITS.message)
    fields.message = `Message must be ${ENQUIRY_LIMITS.message} characters or fewer.`;

  if (Object.keys(fields).length > 0) {
    throw new ValidationError('Enquiry is invalid.', fields);
  }

  return {
    productId,
    name,
    email,
    ...(phone ? { phone } : {}),
    ...(message ? { message } : {}),
  };
}
