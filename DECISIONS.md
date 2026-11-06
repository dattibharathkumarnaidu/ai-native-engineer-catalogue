# Decisions & Assumptions

This document records the assumptions, trade-offs and design decisions made while implementing the proof of concept.

The acceptance criteria intentionally leave some behaviour undefined. Where that happened, I made a reasonable assumption, documented it here and continued with the implementation rather than expanding the scope unnecessarily.

## Assumptions

### A1. How are the five featured products chosen?

The five products shown on the home page are explicitly configured using `FEATURED_PRODUCT_IDS`.

The default configuration is:

```text
1,5,9,13,17
```

These IDs are curated merchandising choices, not a claim that the source's rating values are always the five highest. They can be changed through `FEATURED_PRODUCT_IDS` without changing application code. The current Fake Store dataset is expected to contain all five IDs; if a configured product is missing, the backend logs the missing IDs and returns the products it could retrieve.

### A2. What does "top rated" mean on a category page?

The acceptance criteria do not define a ranking rule or a count. Curated featured products in the category are placed first. The list is then filled, up to `CATEGORY_TOP_RATED_COUNT` (default three), with the category's highest customer-rated products. Curated picks are not repeated. If there are more curated products than the configured count, all curated products are retained. The remaining products appear in the source's order.

### A3. What does search match?

Search is a case-insensitive substring match against product title, description, or category name. Leading, trailing, and repeated whitespace is normalised, and the term is limited to 100 characters. A blank term returns no results instead of the entire catalogue. This is sufficient for the small PoC dataset; it is not intended to provide typo tolerance, stemming, or relevance ranking.

### A4. What happens after an enquiry is submitted?

The customer must provide a name and valid email address; phone and message are optional. The backend looks up the product itself and sends a plain-text email to the configured sales inbox. The customer sees the thank-you state only after the backend reports successful delivery. No customer confirmation email is sent.

### A5. Where are enquiries recorded?

Enquiries are not persisted. For this PoC, successful email delivery is the sales record, which keeps the build small and avoids choosing a database before the business workflow is known. A mail-provider failure is returned to the customer as a retryable submission error; durable storage and delivery retries are production follow-up work.

### A6. Which runtime and providers are included?

The chosen client is a React web app and the backend is Node.js with TypeScript. Fake Store API is the replaceable product source. Product metadata and image assets are retrieved by the backend; image fetches are restricted to the configured provider origin and `/img/` path. Docker Compose and Mailpit provide a local, no-account email workflow; no production email account is required. Internet access is needed for the backend to fetch the external product catalogue and images.

## Simplified or Deferred Requirements

- **Mobile client:** not included because the React web client meets the brief and is the fastest way to provide an interactive PoC without requiring a simulator or emulator.
- **Product administration and a CMS:** featured IDs and category counts are configuration for now. An editing workflow would be premature without knowing who manages merchandising or what approval process they need.
- **Persistent enquiry storage and asynchronous delivery:** omitted to keep the critical path small. This means the system does not provide durable capture or retries if email delivery fails.
- **Production email provider:** Mailpit is local-only and console mail is available for development. SES integration, credentials, bounce handling, and delivery monitoring need a production environment and account, which reviewers should not have to create.
- **Advanced search, pagination, authentication, and CAPTCHA:** omitted because the sample catalogue and public enquiry flow do not establish a need for them. The current API is intentionally small and should be extended when scale or abuse patterns are known.
- **Browser end-to-end testing:** component and API tests cover the acceptance paths, but a full Docker/browser test is deferred to avoid adding setup and runtime to this time-boxed PoC.
- **Cloud deployment resources:** Docker images are used for local execution, but no AWS account configuration or cloud resources are provisioned. The containerized services can be hosted on AWS; a deployed environment and its operational requirements are separate work.

## How the Design Can Grow

- `ProductRepository` hides the external API, maps provider data into the application's product model, and retrieves image assets for the backend image route. A database or commerce platform can replace the adapter without making the browser call that provider directly.
- `Merchandising` separates featured-product and category-ranking choices from catalogue retrieval. The static configuration can later be replaced by an admin-managed or CMS-backed implementation.
- `Mailer` isolates notification delivery from enquiry validation and product lookup. A production adapter such as Amazon SES can be introduced without changing the use case.
- Services own application behavior; the Express routes handle HTTP concerns. This keeps domain and service tests independent of the web framework.
- Frontend design tokens centralize the current visual system so a future brand refresh can change shared values without rewriting page behavior.
- Environment-based configuration and container builds keep deployment settings out of source code. The current Compose stack is for local development, not a claim that production operations are already solved.

## Next With Another Day

1. Persist an enquiry before acknowledging it, then deliver email asynchronously with retry and idempotency. On AWS, evaluate a durable store plus SQS and SES against the expected traffic and retention needs.
2. Add a Playwright end-to-end journey against the Compose stack, including checking that a submitted enquiry reaches Mailpit and that browser product requests stay on `/api`.
3. Add operational behavior for a real deployment: structured metrics and tracing, dependency health checks, secret management, and documented deployment configuration.
4. Validate the merchandising and visual direction with the entrepreneur, then decide whether featured products and category rankings should remain configuration or move to an editable content source.