import type { ErrorRequestHandler, RequestHandler } from 'express';
import { NotFoundError, UpstreamError, ValidationError } from '../domain/errors.js';
import type { Logger } from '../ports/Logger.js';

/** Consistent error envelope: { error: { code, message, fields? } }. Never leaks stack traces. */
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, fields: err.fields } });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
      return;
    }
    if (err instanceof UpstreamError) {
      res.status(502).json({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Products are temporarily unavailable. Please try again shortly.' } });
      return;
    }
    // body-parser errors (malformed JSON, payload too large) carry a status.
    const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : undefined;
    if (status) {
      res.status(status).json({ error: { code: 'BAD_REQUEST', message: 'The request could not be processed.' } });
      return;
    }
    logger.error('Unhandled error', { method: req.method, path: req.path, error: String(err?.stack ?? err) });
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
  };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
};
