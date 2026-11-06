/** Domain errors are transport-agnostic; the HTTP layer maps them to status codes. */
export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
}

export class ValidationError extends Error {
  override readonly name = 'ValidationError';
  constructor(
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** The product data source (or another dependency) failed or returned garbage. */
export class UpstreamError extends Error {
  override readonly name = 'UpstreamError';
}
