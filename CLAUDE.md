# Agent Instructions

This file defines the engineering rules AI coding agents should follow when making changes to this repository.

## Architecture

### Frontend

- The frontend must never call the Fake Store API or another external product data source directly.
- All product data must be retrieved through our backend `/api` endpoints.
- Keep HTTP communication inside `frontend/src/api/client.ts`.
- Keep pages focused on user flows and compose reusable UI components where appropriate.
- Keep product-source-specific response formats out of the frontend.

### Backend

Maintain the following dependency direction:

`domain` → `ports` → `services` → `http/adapters`

The important rule is that domain and application logic must not depend on infrastructure concerns.

- `domain` contains business models, validation rules and domain errors.
- `ports` defines interfaces for external capabilities such as product retrieval, merchandising and email delivery.
- `services` implements application use cases using those interfaces.
- `adapters` integrates with external systems such as Fake Store and SMTP.
- `http` translates HTTP requests and responses to and from application use cases.
- `backend/src/server.ts` is the composition root where concrete adapters are selected and wired together.

Domain and service code must not directly import Express, Nodemailer or concrete adapters.

## External data

Treat all upstream data as untrusted.

The Fake Store response must be mapped to the application's own `Product` domain model inside the Fake Store adapter.

Do not allow Fake Store-specific response structures to leak into services, HTTP handlers or frontend code.

This boundary exists so the current product source can be replaced without redesigning the rest of the application.

## Enquiries

Never trust product information supplied by the client when processing an enquiry.

The client should send the product identifier and customer contact information. The backend must retrieve the authoritative product information through `ProductRepository` before generating the sales enquiry.

Validate enquiry input on the backend even when equivalent validation also exists in the frontend.

Email delivery must be performed through the `Mailer` abstraction rather than directly from route handlers or services.

## Configuration and secrets

- Do not commit secrets, credentials or real environment files.
- Configuration must be read through the backend configuration layer.
- New environment variables must be documented in `.env.example`.
- Validate required configuration when the application starts.
- Tests must not depend on production credentials or paid external services.

## TypeScript

- Use TypeScript strict mode.
- Keep `noUncheckedIndexedAccess` enabled.
- Avoid `any` in production code.
- Prefer explicit domain types at system boundaries.
- Backend relative ESM imports must use `.js` extensions where required by the Node.js module configuration.

## Error handling

Use the application's error types for expected failures, including:

- `ValidationError`
- `NotFoundError`
- `UpstreamError`

Translate application errors into HTTP responses centrally through the HTTP error handler.

API errors should follow the existing envelope:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": {}
  }
}