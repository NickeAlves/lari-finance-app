interface RuntimeRates {
  iva?: number | string;
  fixedExpenses?: number | string;
  products?: number | string;
  salary?: number | string;
  annualTaxReserve?: number | string;
}

interface RuntimeConfig {
  apiBaseUrl?: string;
  locale?: string;
  currency?: string;
  heroImageUrl?: string;
  rates?: RuntimeRates;
}

export interface FinanceRates {
  iva: number;
  fixedExpenses: number;
  products: number;
  salary: number;
  annualTaxReserve: number;
}

export interface AppSettings {
  financeApiUrl: string;
  financeRatesUrl: string;
  authLoginUrl: string;
  authRegisterUrl: string;
  entriesUrl: string;
  locale: string;
  currency: string;
  heroImageUrl: string;
  rates: FinanceRates;
}

declare global {
  interface Window {
    __LARI_CONFIG__?: RuntimeConfig;
  }
}

const defaults: AppSettings = {
  financeApiUrl: '/api/finance/calculate',
  financeRatesUrl: '/api/finance/rates',
  authLoginUrl: '/api/auth/login',
  authRegisterUrl: '/api/auth/register',
  entriesUrl: '/api/entries',
  locale: 'es-ES',
  currency: 'EUR',
  heroImageUrl: '/hero-lari-finance.jpeg',
  rates: {
    iva: 0.21,
    fixedExpenses: 0.2,
    products: 0.08,
    salary: 0.41,
    annualTaxReserve: 0.1,
  },
};

const runtimeConfig =
  (globalThis as typeof globalThis & { __LARI_CONFIG__?: RuntimeConfig }).__LARI_CONFIG__ ??
  globalThis.window?.__LARI_CONFIG__ ??
  {};

const apiBaseUrl = stringSetting(runtimeConfig.apiBaseUrl, '/api');

export const appSettings: AppSettings = {
  financeApiUrl: joinUrl(apiBaseUrl, '/finance/calculate'),
  financeRatesUrl: joinUrl(apiBaseUrl, '/finance/rates'),
  authLoginUrl: joinUrl(apiBaseUrl, '/auth/login'),
  authRegisterUrl: joinUrl(apiBaseUrl, '/auth/register'),
  entriesUrl: joinUrl(apiBaseUrl, '/entries'),
  locale: stringSetting(runtimeConfig.locale, defaults.locale),
  currency: stringSetting(runtimeConfig.currency, defaults.currency),
  heroImageUrl: stringSetting(runtimeConfig.heroImageUrl, defaults.heroImageUrl),
  rates: {
    iva: numberSetting(runtimeConfig.rates?.iva, defaults.rates.iva),
    fixedExpenses: numberSetting(runtimeConfig.rates?.fixedExpenses, defaults.rates.fixedExpenses),
    products: numberSetting(runtimeConfig.rates?.products, defaults.rates.products),
    salary: numberSetting(runtimeConfig.rates?.salary, defaults.rates.salary),
    annualTaxReserve: numberSetting(
      runtimeConfig.rates?.annualTaxReserve,
      defaults.rates.annualTaxReserve,
    ),
  },
};

function stringSetting(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function joinUrl(baseUrl: string, route: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const path = route.trim().replace(/^\/+/, '');

  if (!base) {
    return `/${path}`;
  }

  if (!path) {
    return base;
  }

  return `${base}/${path}`;
}

function numberSetting(value: number | string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
