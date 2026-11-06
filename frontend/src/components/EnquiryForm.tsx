import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ApiError, api } from '../api/client';
import type { Product } from '../api/types';

type Fields = { name: string; email: string; phone: string; message: string; website: string };
type Errors = Partial<Record<keyof Fields, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the server rules for fast feedback; the server remains the source of truth. */
export function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.name.trim()) errors.name = 'Please enter your name.';
  if (!fields.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = 'Please enter a valid email address.';
  return errors;
}

const empty: Fields = { name: '', email: '', phone: '', message: '', website: '' };

export function EnquiryForm({ product, onCancel }: { product: Product; onCancel?: () => void }) {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: keyof Fields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const clientErrors = validate(fields);
    setErrors(clientErrors);
    setFormError(undefined);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await api.submitEnquiry({
        productId: product.id,
        name: fields.name,
        email: fields.email,
        ...(fields.phone.trim() ? { phone: fields.phone } : {}),
        ...(fields.message.trim() ? { message: fields.message } : {}),
        ...(fields.website ? { website: fields.website } : {}),
      });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) setErrors(err.fields as Errors);
      setFormError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="panel panel--success" role="status">
        <h2>Thank you</h2>
        <p>
          We've received your enquiry about <strong>{product.title}</strong>. Our sales team will be in touch soon.
        </p>
      </div>
    );
  }

  const fieldProps = (key: keyof Fields) => ({
    id: `enquiry-${key}`,
    name: key,
    value: fields[key],
    onChange: update(key),
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby': errors[key] ? `enquiry-${key}-error` : undefined,
  });
  const errorFor = (key: keyof Fields) =>
    errors[key] ? (
      <p id={`enquiry-${key}-error`} className="field__error">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form className="panel form" onSubmit={onSubmit} noValidate aria-labelledby="enquiry-heading">
      <h2 id="enquiry-heading">Enquire about this product</h2>
      {formError && (
        <p className="status status--error" role="alert">
          {formError}
        </p>
      )}

      <div className="field">
        <label htmlFor="enquiry-name">Name</label>
        <input {...fieldProps('name')} autoComplete="name" maxLength={100} required />
        {errorFor('name')}
      </div>
      <div className="field">
        <label htmlFor="enquiry-email">Email</label>
        <input {...fieldProps('email')} type="email" autoComplete="email" maxLength={254} required />
        {errorFor('email')}
      </div>
      <div className="field">
        <label htmlFor="enquiry-phone">Phone (optional)</label>
        <input {...fieldProps('phone')} type="tel" autoComplete="tel" maxLength={30} />
        {errorFor('phone')}
      </div>
      <div className="field">
        <label htmlFor="enquiry-message">Message (optional)</label>
        <textarea {...fieldProps('message')} rows={4} maxLength={2000} />
        {errorFor('message')}
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="enquiry-website">Website</label>
        <input {...fieldProps('website')} tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form__actions">
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send enquiry'}
        </button>
        {onCancel && (
          <button type="button" className="button button--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
