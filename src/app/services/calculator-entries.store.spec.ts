import { TestBed } from '@angular/core/testing';
import { CalculatorEntriesStore } from './calculator-entries.store';
import type { CalculatorEntry } from '../calculator.types';

const STORAGE_KEY = 'lari-finance-calculator-v1';

// This test environment's built-in `localStorage` global is an inert `{}`
// (no `--localstorage-file` configured), so it fails `browserStorage()`'s
// feature-detection guard the same way a restricted/SSR environment would.
// Stub a real in-memory Storage here so persistence is actually exercised.
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => void data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
}

function createEntry(overrides: Partial<CalculatorEntry> = {}): CalculatorEntry {
  return {
    id: 'entry-1',
    date: '2026-07-05',
    amount: 100,
    type: 'Entrada',
    includeInReports: false,
    expression: '100 =',
    createdAt: '2026-07-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('CalculatorEntriesStore', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    TestBed.configureTestingModule({});
  });

  it('starts empty when there is nothing in localStorage', () => {
    const store = TestBed.inject(CalculatorEntriesStore);
    expect(store.entries()).toEqual([]);
  });

  it('loads pre-seeded entries from localStorage on creation', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([createEntry()]));
    const store = TestBed.inject(CalculatorEntriesStore);
    expect(store.entries().length).toBe(1);
    expect(store.entries()[0].id).toBe('entry-1');
  });

  it('add() prepends a new entry and persists it', () => {
    const store = TestBed.inject(CalculatorEntriesStore);
    store.add(createEntry({ id: 'a' }));
    store.add(createEntry({ id: 'b' }));
    TestBed.flushEffects();

    expect(store.entries().map((e) => e.id)).toEqual(['b', 'a']);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CalculatorEntry[];
    expect(persisted.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('remove() filters out the matching entry and persists the change', () => {
    const store = TestBed.inject(CalculatorEntriesStore);
    store.add(createEntry({ id: 'a' }));
    store.add(createEntry({ id: 'b' }));

    store.remove('a');
    TestBed.flushEffects();

    expect(store.entries().map((e) => e.id)).toEqual(['b']);
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CalculatorEntry[];
    expect(persisted.map((e) => e.id)).toEqual(['b']);
  });

  it('toggleIncludeInReports() flips only the matching entry', () => {
    const store = TestBed.inject(CalculatorEntriesStore);
    store.add(createEntry({ id: 'a', includeInReports: false }));
    store.add(createEntry({ id: 'b', includeInReports: false }));

    store.toggleIncludeInReports('a');

    const a = store.entries().find((e) => e.id === 'a');
    const b = store.entries().find((e) => e.id === 'b');
    expect(a?.includeInReports).toBe(true);
    expect(b?.includeInReports).toBe(false);
  });
});
