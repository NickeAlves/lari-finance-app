#!/bin/sh
set -eu

js_escape() {
	printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /srv/env.js <<EOF
window.__LARI_CONFIG__ = {
  "apiBaseUrl": "$(js_escape "${API_BASE_URL}")",
  "locale": "$(js_escape "${LARI_LOCALE}")",
  "currency": "$(js_escape "${LARI_CURRENCY}")",
  "heroImageUrl": "$(js_escape "${LARI_HERO_IMAGE_URL}")",
  "rates": {
    "iva": "$(js_escape "${LARI_IVA_RATE}")",
    "fixedExpenses": "$(js_escape "${LARI_FIXED_EXPENSES_RATE}")",
    "products": "$(js_escape "${LARI_PRODUCTS_RATE}")",
    "salary": "$(js_escape "${LARI_SALARY_RATE}")",
    "annualTaxReserve": "$(js_escape "${LARI_ANNUAL_TAX_RESERVE_RATE}")"
  }
};
EOF

exec "$@"
