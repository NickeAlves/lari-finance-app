# Lari Finance

Financial management app for self-employed professionals. Tracks payment entries, automatically calculates taxes and expenses, generates reports by period, and exports data as PDF or Excel.

## Features

- **Authentication** — login and registration via API, session persisted in localStorage
- **Entries** — create, edit, and delete records with client name, amount, payment method, date, and notes; synced with the API and cached offline
- **Automatic calculations** — IVA, fixed expenses, products, salary, and annual tax reserve computed per entry, via API or local fallback
- **Reports** — views by day, week, month, or custom period with totals, average ticket, top client, and breakdown by payment method
- **Export** — XLSX (entries, summary, and payment method breakdown) and PDF
- **Environment-based configuration** — rates, currency, locale, and API URL configurable via environment variables at runtime, no rebuild required

## Tech stack

- [Angular 21](https://angular.dev) · TypeScript 5.9 · RxJS 7.8
- [Vitest](https://vitest.dev) (unit tests)
- [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable (PDF export)
- [xlsx](https://github.com/SheetJS/sheetjs) (Excel export)
- [Lucide Angular](https://lucide.dev) (icons)
- [Caddy](https://caddyserver.com) (production web server, automatic TLS)

## Local development

Prerequisites: Node.js 22+, npm 11+.

```bash
npm install
npm start
```

The app will be available at `http://localhost:4200/`. API requests are proxied through the configuration in `proxy.conf.json`.

## Environment variables

Copy `.env.example` to `.env` to override local configuration:

```bash
cp .env.example .env
```

`public/env.js` is generated automatically by `npm start` and `npm run build`. In Docker, it is recreated at container startup from the actual environment variables.

| Variable | Description | Default |
|---|---|---|
| `API_BASE_URL` | Base API URL. Routes are composed from it (`/auth/login`, `/auth/register`, `/finance/calculate`, `/finance/rates`, `/entries`) | `/api` |
| `LARI_LOCALE` | Locale used by currency and date formatters | `es-ES` |
| `LARI_CURRENCY` | Currency code (ISO 4217) | `EUR` |
| `LARI_HERO_IMAGE_URL` | URL of the image displayed at the top of the app | — |
| `LARI_IVA_RATE` | IVA rate (between 0 and 1) | `0.21` |
| `LARI_FIXED_EXPENSES_RATE` | Fixed expenses rate | `0.20` |
| `LARI_PRODUCTS_RATE` | Products rate | `0.08` |
| `LARI_SALARY_RATE` | Salary rate | `0.41` |
| `LARI_ANNUAL_TAX_RESERVE_RATE` | Annual tax reserve rate | `0.10` |
| `APP_PORT` | Port exposed by Docker Compose | `8080` |
| `PORT` | Port injected by Railway in production | — |
| `DOCKER_IMAGE` | Docker image name used in Compose | — |

## Docker and Railway

To run locally with Docker Compose:

```bash
docker compose up --build
```

The app will be available on the port defined by `APP_PORT`. To stop:

```bash
docker compose down
```

On Railway, publish the repository with the `Dockerfile` at the root. Railway detects the `Dockerfile` automatically and injects the `PORT` variable; Caddy uses that port at runtime. Set `API_BASE_URL` and the `LARI_*` variables in the Railway dashboard to adjust the endpoint, currency, image, or rates without modifying the code.

## Tests

```bash
ng test
```

Runs unit tests with [Vitest](https://vitest.dev).

## Production build

```bash
npm run build
```

Build artifacts are placed in `dist/`. The production build is automatically optimized by the Angular CLI.
