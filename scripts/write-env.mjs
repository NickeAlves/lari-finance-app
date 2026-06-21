import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const outputPath = resolve(root, 'public/env.js');

const env = { ...readDotEnv(envPath), ...process.env };

const config = {
  apiBaseUrl: env.API_BASE_URL,
  locale: env.LARI_LOCALE,
  currency: env.LARI_CURRENCY,
  heroImageUrl: env.LARI_HERO_IMAGE_URL,
  rates: {
    iva: env.LARI_IVA_RATE,
    fixedExpenses: env.LARI_FIXED_EXPENSES_RATE,
    products: env.LARI_PRODUCTS_RATE,
    salary: env.LARI_SALARY_RATE,
    annualTaxReserve: env.LARI_ANNUAL_TAX_RESERVE_RATE,
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `window.__LARI_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`);

function readDotEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const separator = trimmed.indexOf('=');

      if (separator === -1) {
        return values;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');

      return { ...values, [key]: value };
    }, {});
}
