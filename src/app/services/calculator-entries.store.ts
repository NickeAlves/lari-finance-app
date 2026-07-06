import { Injectable, effect, signal } from '@angular/core';
import { CalculatorEntry } from '../calculator.types';

const STORAGE_KEY = 'lari-finance-calculator-v1';

@Injectable({ providedIn: 'root' })
export class CalculatorEntriesStore {
  private readonly _entries = signal<CalculatorEntry[]>(this.load());

  readonly entries = this._entries.asReadonly();

  constructor() {
    effect(() => {
      this.browserStorage()?.setItem(STORAGE_KEY, JSON.stringify(this._entries()));
    });
  }

  add(entry: CalculatorEntry): void {
    this._entries.update((entries) => [entry, ...entries]);
  }

  remove(id: string): void {
    this._entries.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  toggleIncludeInReports(id: string): void {
    this._entries.update((entries) =>
      entries.map((entry) =>
        entry.id === id ? { ...entry, includeInReports: !entry.includeInReports } : entry,
      ),
    );
  }

  private load(): CalculatorEntry[] {
    try {
      const stored = this.browserStorage()?.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CalculatorEntry[]) : [];
    } catch {
      return [];
    }
  }

  private browserStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined {
    const storage = globalThis.localStorage as Partial<Storage> | undefined;

    if (
      typeof storage?.getItem === 'function' &&
      typeof storage.setItem === 'function' &&
      typeof storage.removeItem === 'function'
    ) {
      return storage as Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
    }

    return undefined;
  }
}
