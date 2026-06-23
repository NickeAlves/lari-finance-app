# Security Policy

## Supported version

This project does not follow public semantic versioning. Only the production version (branch `main`) receives security updates.

## Reporting vulnerabilities

Send an email to **nickalves88@gmail.com** with the subject `[SECURITY] Lari Finance`.

Include in the report:
- Clear description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- Potential impact and attack surface

You can expect a response within **5 business days**. Confirmed vulnerabilities will be fixed with priority; you will be notified when the fix is in production.

Do not open public issues to report security flaws.

## Security considerations

### Authentication and tokens
- The authentication token is stored in `localStorage` (`lari-finance-auth-v1`). This makes it susceptible to XSS attacks. Make sure there is no third-party script injection in the application.
- The HTTP interceptor (`auth.interceptor.ts`) adds the `Authorization: Bearer <token>` header to all outgoing requests.

### Environment variables
- `API_BASE_URL` and the `LARI_*` variables are embedded in `public/env.js` at runtime and are visible to the client. Do not put secrets in these variables.
- Real secrets (backend API keys, database credentials) must exist only on the server and must never be exposed via `API_BASE_URL` or similar.

### HTTPS in production
- Caddy provisions TLS automatically in production. Never expose the application over plain HTTP in a production environment.
- On Railway, HTTPS is managed by the platform.

### Data in localStorage
- Entries pending sync are cached in `localStorage` (`lari-finance-payments-v1`). Sensitive financial data is accessible to any script running on the same origin.
