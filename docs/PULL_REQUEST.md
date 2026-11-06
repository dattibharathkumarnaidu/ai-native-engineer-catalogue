# PR: Product catalogue PoC — browse, search, product details, enquiries

> PR description for `feature/catalogue-poc` → `main`.

## What
A clickable proof of concept covering all five acceptance criteria:

- **Home:** the 5 hand-picked "top rated" products (`FEATURED_PRODUCT_IDS`).
- **Category:** top rated products for the category, then the rest of the category.
- **Search:** only products whose title, description or category matches the term.
- **Product:** a details page reached from any product tile.
- **Enquiry:** the Enquire form emails the sales inbox (Mailpit locally) and shows "Thank you".

## How to review (≈ 3 min)
```bash
docker compose up --build
# app http://localhost:8080 · inbox http://localhost:8025
```
Suggested reading order: `backend/src/server.ts` (composition root) → `ports/` → `services/` → `adapters/fakestore/` → `frontend/src/api/client.ts` → `frontend/src/acceptance.test.tsx`.

## Why it's built this way
The brief says the **product source, look and feel and email provider will change**, so each sits behind a boundary:
- `ProductRepository`: Fake Store today. The adapter maps into our own `Product` model, and search/category filtering are on the interface so a real source can do them natively.
- `Mailer`: SMTP (Mailpit locally, SES/SendGrid in prod) or console.
- `tokens.css`: brand lives in design tokens, not components.
- `Merchandising`: featured choices are config today, CMS/admin later.

The browser only ever calls our `/api` (same-origin via nginx/Vite proxy).

## Key assumptions (full list in DECISIONS.md)
- Category "top rated" = curated picks in that category, topped up by customer rating (A2).
- Search = case-insensitive substring over title, description and category. Blank searches are blocked (A3).
- No confirmation email to the customer, and enquiries are not persisted. The email is the record (A7, A8).

## Security basics
Server-side validation (client mirrors it for UX), product looked up server-side (never trusted from the client), plain-text email + CR/LF stripping (no HTML or header injection), helmet, CORS allowlist, 10 kB body limit, per-IP rate limit and honeypot on enquiries, consistent error envelope with no stack traces, config validated at startup, no secrets committed.

## Tests
- Backend: domain, adapter (caching, timeouts, malformed upstream data, image proxy origin restriction), services, HTTP API (Supertest).
- Frontend: one RTL test per acceptance criterion through real routes, plus unhappy paths and the API client.
- CI runs typecheck, test and build for both packages.
- Local verification: all 68 tests passed (53 backend, 15 frontend); backend and frontend typechecks and production builds passed; Docker Compose started successfully; the backend returned five featured products; product images loaded through `/api`; a submitted test enquiry arrived in Mailpit.

## Not in this PR (and why)
Mobile app, persistence/admin, E2E browser tests, CAPTCHA, pagination. See DECISIONS.md "dropped or simplified" and "next".

## Time spent
Planning 20m · Building 1h45m · Testing 25m · Reviewing/docs 20m · **Total 2h50m**
