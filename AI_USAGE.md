# AI Usage

## Tools and models

- **Microsoft 365 Copilot:** Used to help plan the solution, generate and review backend and frontend code, create tests, Docker and CI configuration, and draft project documentation.
- I reviewed the generated output, ran the solution locally, executed the TypeScript checks and complete automated test suite, investigated failures, and corrected issues found during verification.

## Agent instruction files

- [`CLAUDE.md`](CLAUDE.md): Records the architecture rules, coding conventions, testing expectations and definition of done used to keep AI-assisted changes consistent with the intended design.

## Plan / spec

- [`docs/PLAN.md`](docs/PLAN.md): Captures the architecture, critical-path build order and mapping between the acceptance criteria and tests used during implementation.
- The implementation was intentionally focused on the critical path first: product retrieval, catalogue behaviour, enquiry submission, API integration, frontend flows, testing and local execution.

## Key prompts and moments that shaped the solution

### 1. Treating the PoC as a foundation rather than a throwaway prototype

I provided the complete brief and assessment criteria at the start, with particular attention to the requirement that the PoC should be capable of evolving rather than being discarded.

This led to separating the application around explicit boundaries:

- `ProductRepository` for the product data source
- `Mailer` for email delivery
- `Merchandising` for product selection rules
- Services for application use cases
- A single composition root for selecting concrete adapters

The intention was to keep likely areas of change isolated without introducing unnecessary infrastructure for the PoC.

### 2. Keeping product-source behaviour behind `ProductRepository`

Search, product retrieval and category filtering are exposed through the `ProductRepository` abstraction rather than being coupled directly to the Fake Store API.

This means the Fake Store adapter can perform the simple operations appropriate for the current dataset, while a future product source could implement those operations using its own database, commerce platform or search capabilities.

The rest of the application works with our own product domain model rather than depending on the Fake Store response structure.

### 3. Making the "top rated per category" assumption explicit

The acceptance criteria specify five chosen top-rated products for the home page, but do not completely define how "top rated" should work within each category.

I made the following assumption:

1. Curated products belonging to the category are considered first.
2. Remaining positions are filled using the highest customer ratings in that category.
3. The default category top-rated count is three.
4. Products selected as top-rated are not repeated in the additional-products section.

This assumption is documented in `DECISIONS.md` rather than being left as implicit application behaviour.

### 4. Making email delivery testable locally

Mailpit is used with Docker Compose as the local SMTP destination.

This allows a reviewer to submit an enquiry and inspect the resulting sales email locally without creating an external account or using a paid service.

Email delivery is behind the `Mailer` interface, so the local implementation can later be replaced or configured for a production email provider such as Amazon SES without changing the enquiry use case.

### 5. Mapping tests to the acceptance criteria

The testing approach was driven by the behaviours in the brief rather than by code coverage alone.

The frontend tests exercise the main user flows through application routes while replacing only the API boundary where appropriate. Backend tests cover domain behaviour, services, adapters, validation and HTTP behaviour.

This gives confidence around the critical paths while keeping the test suite appropriate for the time-box.

## Where AI output needed correction

| Issue | How it was caught | Fix |
|---|---|---|
| A generated configuration test assumed validation errors would be returned in a fixed order. | Running the backend tests during implementation exposed the failing assertion. | Changed the assertion to verify that every expected validation problem is reported without depending on their order. |
| Product pages detected 404 errors using the loose structural check `'status' in error`. | Code review of error-handling paths. | Replaced it with `error instanceof ApiError && error.status === 404` so the application explicitly checks the expected error type. |
| An `eslint-disable` comment was generated even though ESLint was not part of the project. | Code review. | Removed the unnecessary linter-specific directive and retained an explanatory comment where appropriate. |
| `vite.config.ts` initially referenced `process.env` even though the frontend TypeScript configuration was intended around browser/Vite types. | Review of the TypeScript configuration and generated Vite configuration. | Removed the unnecessary environment override and kept the development API proxy configuration simple. |
| The initial generation environment could not access the npm registry, so the dependency-based Express and React test suites could not initially be executed there. | I treated this as an explicit verification gap rather than assuming the generated solution worked. | I subsequently installed the real dependencies locally and ran `npm run typecheck` for both applications and the complete automated test suite. |
| The generated category API test expected two top-rated products even though the configured/default category top-rated count was three. | Running the complete automated test suite locally produced one failure: 50 of 51 tests passed. The failing assertion expected product IDs `['1', '3']`, whereas the implementation returned `['1', '3', '2']`. I checked the implementation against the documented merchandising assumption before changing anything. | Corrected the stale test expectation to three top-rated products with the remaining product in the additional-products list. I did not change production behaviour simply to satisfy an incorrect generated test. After the correction, the complete automated test suite passed. |
| Product mapping exposed upstream image URLs, so the browser fetched image assets directly from Fake Store. | Browser network inspection showed image requests to `fakestoreapi.com` even though catalogue JSON used our `/api` routes. | Added a backend image route and a repository proxy restricted to the configured source origin and `/img/` path, with redirects disabled. Verified all five images load through `/api` and the browser makes no direct Fake Store requests. |

## Review and ownership

I used AI as an implementation accelerator rather than treating its output as authoritative.

I reviewed the generated solution and ran the TypeScript checks and complete automated test suite locally. A useful example of that review was the category API test failure. The generated test expected two top-rated products, while the configured behaviour and documented decision specified three.

Rather than immediately changing the application until the test passed, I checked the test fixture, configuration, implementation and documented assumption. I concluded that the implementation represented the intended behaviour and that the test expectation was stale, so I corrected the test and reran the suite successfully.

I would defend the separation between the frontend, backend, product provider, merchandising logic and email delivery. The client only communicates with our backend, the Fake Store API is hidden behind `ProductRepository`, email delivery is behind `Mailer`, and merchandising decisions are kept separate from product retrieval.

This adds some structure to a small PoC, but it directly addresses the brief's expectation that the product source, look and feel and email provider will change.

I would also defend using React with TypeScript and Node.js with TypeScript. For a time-boxed PoC, using TypeScript across both layers reduces context switching and makes changes safer while still allowing the implementation to remain relatively small.

Docker Compose and Mailpit are also deliberate choices. They provide a reproducible local environment and a way to exercise email delivery without requiring reviewers to register for or pay for an external email service.

I would defend keeping search deliberately simple at this stage. The Fake Store catalogue is small enough that case-insensitive text matching across the title, description and category is sufficient. Introducing Elasticsearch, OpenSearch or another search platform at this point would add operational complexity without solving a demonstrated requirement.

## What I would change for production

One design decision I would change for production is treating email as the only record of an enquiry.

For the PoC this keeps the critical path small and avoids introducing an unnecessary database. In production I would persist the enquiry before attempting email delivery and send the notification asynchronously. For an AWS deployment, one option would be persistent storage combined with an SQS-backed delivery workflow and Amazon SES.

This would ensure that a temporary email-provider failure does not cause a customer enquiry to be lost and would allow retry and delivery status to be handled reliably.

I would also add end-to-end browser testing with Playwright. The current unit, service, API and frontend component tests provide useful confidence within the time-box, but an end-to-end test running against the Docker Compose environment would verify the entire journey from browsing the catalogue through submitting an enquiry and confirming that the sales email is generated.

## Verification performed

After installing the project dependencies locally, I performed the following verification:

- Backend TypeScript type checking passed.
- Frontend TypeScript type checking passed.
- The complete automated test suite passed.
- A stale generated category test expectation was identified, reviewed and corrected to match the documented merchandising decision.
- The application was built and run successfully using Docker Compose.
- The frontend successfully retrieved catalogue data through the backend `/api` endpoints.
- The featured-products endpoint returned the configured five products.
- The main acceptance criteria were manually exercised in the browser.
- The enquiry flow was tested from the product page through successful submission and the thank-you confirmation.
- The resulting sales enquiry email was verified in Mailpit with the expected product and customer details.
- Browser network activity confirmed catalogue data and product images use the application's `/api` endpoints; no browser request goes directly to Fake Store.

## Time Spent

Approximately 2 hours 50 minutes total:

- Planning: 20 minutes
- Building: 1 hour 45 minutes
- Testing: 25 minutes
- Reviewing and documentation: 20 minutes