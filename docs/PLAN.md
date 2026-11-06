# Plan / Spec (used to drive the AI build)

## Goal
A clickable PoC of a product catalogue (home, category, search, product, enquiry) that is a **foundation**: product source, look and feel and email provider will change.

## Non-negotiables (from the brief)
- React (TS) client + Node (TS) backend. The client never calls Fake Store.
- Runs locally in under 10 minutes, ideally with one command (`docker compose up`). No paid services. No committed secrets.
- Tests on the critical path. Docs: README, DECISIONS, AI_USAGE, PR description.

## Architecture
```
Browser ──► React SPA ──/api──► Express (http) ──► Services ──► Ports ──► Adapters ──► Fake Store / SMTP(Mailpit)
                                                       ▲
                                         server.ts wires concrete adapters
```
- Ports: `ProductRepository`, `Mailer`, `Merchandising`, `Logger`.
- Domain: `Product` (string id, `Money`, `Category {slug,name}`), search matching, enquiry validation, error types.

## Build order (critical path first)
1. Domain + ports + Fake Store adapter (cache, timeout, malformed-data handling). Unit tests.
2. CatalogService (featured, category split, search, product) + EnquiryService (validate → lookup → email). Unit tests.
3. HTTP layer + error envelope + security basics (helmet, CORS allowlist, 10kb body limit, rate limit, honeypot). Supertest.
4. Frontend: API client → layout/search/category nav → pages → enquiry form. Acceptance tests per criterion.
5. Docker Compose (backend, nginx-served SPA, Mailpit), CI, docs.

## Acceptance → test mapping
| Criterion | Backend test | Frontend test |
|---|---|---|
| Home shows 5 featured | `CatalogService.getFeatured`, `GET /api/featured` | `acceptance.test.tsx` › Home page |
| Category: top rated + more | `getCategoryPage`, `GET /api/categories/:slug` | › Category page |
| Search only matching | `matchesSearch`, `search`, `GET /api/search` | › Search |
| Product tile → details | `GET /api/products/:id` | › Product page |
| Enquiry → email + thank you | `EnquiryService`, `POST /api/enquiries` | › Enquiry |

## Out of scope
Auth, cart, persistence, admin UI, mobile app, CAPTCHA, E2E browser tests (see DECISIONS.md).
