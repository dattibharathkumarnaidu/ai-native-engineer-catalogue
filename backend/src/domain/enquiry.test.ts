import { describe, expect, it } from 'vitest';
import { parseEnquiry } from './enquiry.js';
import { ValidationError } from './errors.js';

function fieldsFor(body: unknown): Record<string, string> {
  try {
    parseEnquiry(body);
  } catch (err) {
    if (err instanceof ValidationError) return err.fields;
    throw err;
  }
  return {};
}

describe('parseEnquiry', () => {
  it('accepts and normalises a valid enquiry', () => {
    expect(
      parseEnquiry({ productId: ' 1 ', name: ' Ada ', email: 'ADA@Example.com ', phone: '', message: ' Hi ' }),
    ).toEqual({ productId: '1', name: 'Ada', email: 'ada@example.com', message: 'Hi' });
  });

  it('requires product, name and email', () => {
    expect(Object.keys(fieldsFor({})).sort()).toEqual(['email', 'name', 'productId']);
  });

  it('rejects malformed email and phone', () => {
    const fields = fieldsFor({ productId: '1', name: 'Ada', email: 'not-an-email', phone: 'call me' });
    expect(Object.keys(fields).sort()).toEqual(['email', 'phone']);
  });

  it('enforces length limits', () => {
    const fields = fieldsFor({ productId: '1', name: 'a'.repeat(101), email: 'a@b.co', message: 'm'.repeat(2001) });
    expect(Object.keys(fields).sort()).toEqual(['message', 'name']);
  });

  it('ignores unknown fields and non-object bodies safely', () => {
    expect(parseEnquiry({ productId: '1', name: 'Ada', email: 'a@b.co', isAdmin: true })).toEqual({
      productId: '1',
      name: 'Ada',
      email: 'a@b.co',
    });
    expect(Object.keys(fieldsFor(null))).toHaveLength(3);
    expect(Object.keys(fieldsFor({ name: 42, email: {}, productId: [] }))).toHaveLength(3);
  });
});
