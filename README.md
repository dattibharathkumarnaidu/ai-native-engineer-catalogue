# Product Catalogue

A proof of concept for browsing a product catalogue, searching and filtering products, viewing product details, and submitting a product enquiry to a sales inbox.

The solution is intentionally structured as a foundation rather than a throwaway prototype. The areas expected to change, including the product data source, visual design, merchandising rules and email provider, are separated behind clear application boundaries.

## Technology choices

| Layer | Choice | Reason |
|---|---|---|
| Client | **React + TypeScript** with Vite and React Router | A web client is quick for the entrepreneur and reviewer to interact with, requires no simulator or emulator, and TypeScript provides safer refactoring as the product evolves. |
| Backend | **Node.js + TypeScript** with Express | Using TypeScript across both client and backend reduces context switching. Express keeps the HTTP layer small while allowing the application logic to remain framework-independent. |
| Local email | **Mailpit** via Docker | Provides a local SMTP server and browser inbox without requiring a paid service or external account. |

The browser never calls the Fake Store API directly.

Product data flows through:

```text
Browser
  ↓
React application
  ↓
Our backend /api
  ↓
ProductRepository
  ↓
Fake Store adapter
  ↓
Fake Store API
```

Product images follow the same path: the backend retrieves them from the configured provider and serves them through `/api/products/:id/image`. The browser does not request product data or images from Fake Store directly. A future product provider can replace Fake Store without requiring the frontend to understand the new provider.

---

## Quick start

### Prerequisites

For the simplest setup:

- Docker Desktop with Docker Compose v2
- Internet access so the backend can retrieve products from the Fake Store API

Start the complete application from the repository root:

```bash
docker compose up --build
```

Once the containers are running:

| Service | URL |
|---|---|
| Web application | `http://localhost:8080` |
| Backend health check | `http://localhost:4000/health` |
| Featured-products API | `http://localhost:4000/api/featured` |
| Mailpit sales inbox | `http://localhost:8025` |

### Suggested acceptance-criteria walkthrough

1. Open `http://localhost:8080`.
2. Confirm the home page displays five featured products.
3. Open a category and confirm it contains a top-rated section and additional products.
4. Search for a term such as `jacket`.
5. Open a product from a product tile.
6. Select **Enquire**.
7. Enter contact details and submit the enquiry.
8. Confirm the customer sees the thank-you state.
9. Open `http://localhost:8025`.
10. Confirm the sales enquiry email was received by Mailpit.

No paid service or external email account is required for this local workflow.

Stop the application with:

```bash
docker compose down
```

---

## Local development

### Prerequisites

- Node.js 22
- npm
- Docker Desktop if using Mailpit locally

Verify the local tools:

```bash
node --version
npm --version
docker --version
docker compose version
```

### Install dependencies

From the repository root:

```bash
npm run install:all
```

### Start the local email inbox

```bash
docker compose up mailpit
```

Mailpit will be available at:

```text
http://localhost:8025
```

### Start the backend

In another terminal:

```bash
npm --prefix backend run dev
```

The backend runs at:

```text
http://localhost:4000
```

If local configuration overrides are required, use the environment variables documented in `.env.example`.

Alternatively, `MAIL_TRANSPORT=console` can be used for development when an SMTP inbox is not required.

### Start the frontend

In another terminal:

```bash
npm --prefix frontend run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

During development, `/api` requests are proxied to the locally running backend.

---

## Configuration

Runtime configuration is supplied through environment variables and validated by the backend configuration layer.

See:

```text
.env.example
```

for the available values.

Configuration includes items such as:

- featured product IDs
- number of top-rated category products
- currency
- sales inbox address
- mail transport
- SMTP settings
- Fake Store base URL

The repository does not require committed secrets for local execution.

### Example: change the five featured products

#### PowerShell

```powershell
$env:FEATURED_PRODUCT_IDS = "2,4,6,8,10"
docker compose up --build
```

#### Bash

```bash
FEATURED_PRODUCT_IDS=2,4,6,8,10 docker compose up --build
```

---

## Tests

Run the complete automated test suite from the repository root:

```bash
npm test
```

Run TypeScript checks for both applications:

```bash
npm run typecheck
```

Run them together before committing:

```bash
npm run typecheck
npm test
```

### Backend testing

The backend uses Vitest and Supertest.

Tests cover areas including:

- product-domain behaviour
- search matching
- enquiry validation
- category slug handling
- catalogue service behaviour
- category merchandising behaviour
- enquiry processing
- Fake Store response mapping
- product caching
- upstream failures
- image proxy origin validation
- HTTP endpoints
- API error responses
- rate limiting
- security headers

### Frontend testing

The frontend uses Vitest and React Testing Library.

Tests cover the important user-facing flows, including:

- five featured products on the home page
- category top-rated and additional products
- search behaviour
- product detail navigation
- enquiry submission
- validation errors
- empty/error states
- API failures
- product not found behaviour

The automated suite has been run locally after installing the real dependencies. During that verification, one stale AI-generated category test expectation was found and corrected after checking it against the documented merchandising behaviour. The complete automated test suite subsequently passed.

See `AI_USAGE.md` for details of that review.

---

## Production builds

Build the backend:

```bash
npm --prefix backend run build
```

Build the frontend:

```bash
npm --prefix frontend run build
```

These commands should be run before submission in addition to the automated tests.

---

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `GET` | `/api/featured` | Return the five configured featured products |
| `GET` | `/api/categories` | Return available product categories |
| `GET` | `/api/categories/:slug` | Return category information, top-rated products and additional products |
| `GET` | `/api/search?q=term` | Search product title, description and category |
| `GET` | `/api/products/:id` | Return one product |
| `GET` | `/api/products/:id/image` | Return the product image through the backend |
| `POST` | `/api/enquiries` | Validate an enquiry, retrieve the product server-side and send the enquiry to the sales inbox |

### Enquiry request

Example:

```json
{
  "productId": "1",
  "name": "Alex Customer",
  "email": "alex@example.com",
  "phone": "+44 1234 567890",
  "message": "Please contact me about this product."
}
```

The backend does not trust product details supplied by the browser. It retrieves the product using `productId` before constructing the sales enquiry.

A successful request returns a reference and triggers delivery through the configured `Mailer`.

### Error responses

API errors use a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation responses can also include field-level errors.

---

## Project structure

```text
backend/src/
  domain/
    Product model
    search and enquiry rules
    domain errors

  ports/
    ProductRepository
    Mailer
    Merchandising
    Logger

  adapters/
    Fake Store product repository
    SMTP / console mailers
    static merchandising

  services/
    CatalogService
    EnquiryService

  http/
    Express routes
    HTTP error mapping

  app.ts
    Builds the Express application from injected dependencies

  server.ts
    Composition root that selects and wires concrete adapters

frontend/src/
  api/
    Typed API client

  components/
    Shared UI components

  pages/
    Home
    Category
    Search
    Product
    NotFound

  styles/
    tokens.css
    app.css
```

### Architecture

The important backend dependency principle is:

```text
HTTP / infrastructure
        ↓
Application services
        ↓
Ports and domain model
```

External technologies are kept behind adapters.

For example:

```text
CatalogService
      ↓
ProductRepository
      ↓
FakeStoreProductRepository
```

and:

```text
EnquiryService
      ↓
Mailer
      ↓
SmtpMailer
```

The service layer therefore does not need to know which product API or email provider is being used.

---

## Security and validation

The PoC includes basic protections appropriate to its scope:

- backend enquiry validation
- authoritative server-side product lookup
- consistent API error handling
- no stack traces returned to clients
- request body-size limits
- security headers
- CORS configuration
- enquiry rate limiting
- honeypot protection
- plain-text sales emails
- no committed application secrets

These controls are a baseline for the PoC rather than a claim of production security certification.

---

## How the design can evolve

### Replace Fake Store

Implement another `ProductRepository`, map the provider's data into the application's `Product` model and select the new adapter in the composition root.

The frontend and catalogue services should not need to understand the new provider's response structure.

### Replace the email provider

Implement or configure another `Mailer` adapter.

The enquiry service does not depend directly on SMTP or a particular email vendor.

### Replace the visual design

Brand-level values are concentrated in:

```text
frontend/src/styles/tokens.css
```

The final creative direction can therefore change without coupling visual decisions to product or enquiry logic.

### Replace merchandising configuration

`Merchandising` separates featured-product decisions from product retrieval.

Configuration could later be replaced by a CMS, database or administration interface.

---

## AWS compatibility

The project does not include AWS infrastructure because deployment is outside the acceptance criteria.

The current architecture avoids depending on infrastructure that would prevent a later AWS deployment.

A possible future deployment could use:

- S3 and CloudFront for the static frontend
- ECS/Fargate for the backend container
- SES for email
- SQS for asynchronous enquiry notification
- PostgreSQL or DynamoDB if enquiries become persistent
- Secrets Manager for production credentials

The final infrastructure should be chosen based on actual production scale and operational requirements rather than added prematurely to the PoC.

---

## CI

The repository includes a GitHub Actions workflow intended to run:

- TypeScript checks
- automated tests
- builds

for pull requests.

Before submission, the pull request should remain open against `main` as required by the brief.

---

## Documentation

Additional design and review information is available in:

- [`DECISIONS.md`](DECISIONS.md) for assumptions, scope decisions, extensibility decisions and next steps
- AI_USAGE.md for AI usage, review and corrections
- [`CLAUDE.md`](CLAUDE.md) for agent engineering instructions
- docs/PLAN.md for the implementation plan and acceptance-test mapping

---

## Time spent

The implementation was time-boxed around the critical path. The table below should contain the actual time spent rather than an estimate chosen to fit the requested 2 to 3 hour window.

| Activity | Time |
|---|---:|
| Planning and assumptions | **Replace with actual time** |
| Building and AI-assisted implementation | **Replace with actual time** |
| Testing and fixes | **Replace with actual time** |
| Review and documentation | **Replace with actual time** |
| **Total** | **Replace with actual total** |

I have recorded the actual time honestly, including AI-assisted implementation, local verification, fixes and documentation review.