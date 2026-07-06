import { Component, computed, EventEmitter, inject, Output, signal } from '@angular/core';
import { LucideDelete, LucidePlus, LucideTrash2, LucideWallet } from '@lucide/angular';
import { appSettings } from './app-settings';
import { CalculatorEntryDialogComponent } from './calculator-entry-dialog.component';
import {
  CalculatorOperator,
  CalculatorState,
  initialCalculatorState,
  reduceCalculator,
} from './calculator-engine';
import { CalculatorEntry, CalculatorEntryModalState, CalculatorEntryType } from './calculator.types';
import { CalculatorEntriesStore } from './services/calculator-entries.store';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CalculatorEntryDialogComponent, LucideDelete, LucidePlus, LucideTrash2, LucideWallet],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  private readonly calculatorStore = inject(CalculatorEntriesStore);

  @Output() transferToPayments = new EventEmitter<CalculatorEntry>();

  private readonly moneyFormatter = new Intl.NumberFormat(appSettings.locale, {
    style: 'currency',
    currency: appSettings.currency,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat(appSettings.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  readonly state = signal<CalculatorState>(initialCalculatorState());
  readonly entryModal = signal<CalculatorEntryModalState | null>(null);

  readonly display = computed(() => this.state().currentInput);

  readonly history = computed(() =>
    [...this.calculatorStore.entries()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  pressDigit(digit: string): void {
    this.state.update((state) => reduceCalculator(state, { type: 'digit', digit }));
  }

  pressDecimal(): void {
    this.state.update((state) => reduceCalculator(state, { type: 'decimal' }));
  }

  pressOperator(operator: CalculatorOperator): void {
    this.state.update((state) => reduceCalculator(state, { type: 'operator', operator }));
  }

  pressPercent(): void {
    this.state.update((state) => reduceCalculator(state, { type: 'percent' }));
  }

  pressEquals(): void {
    this.state.update((state) => reduceCalculator(state, { type: 'equals' }));
  }

  pressBackspace(): void {
    this.state.update((state) => reduceCalculator(state, { type: 'backspace' }));
  }

  pressClear(): void {
    this.state.set(initialCalculatorState());
  }

  openEntryModal(type: CalculatorEntryType): void {
    this.entryModal.set({
      type,
      date: this.toDateInput(new Date()),
      amount: null,
      description: '',
    });
  }

  closeEntryModal(): void {
    this.entryModal.set(null);
  }

  saveEntry(state: CalculatorEntryModalState): void {
    this.calculatorStore.add({
      id: crypto.randomUUID(),
      date: state.date,
      amount: Math.abs(state.amount ?? 0),
      type: state.type,
      includeInReports: false,
      expression: state.description || undefined,
      createdAt: new Date().toISOString(),
    });

    this.entryModal.set(null);
  }

  toggleHistoryEntry(id: string): void {
    this.calculatorStore.toggleIncludeInReports(id);
  }

  removeHistoryEntry(id: string): void {
    this.calculatorStore.remove(id);
  }

  money(value: number): string {
    return this.moneyFormatter.format(value);
  }

  formatDate(dateInput: string): string {
    return this.dateFormatter.format(this.parseDate(dateInput));
  }

  private parseDate(dateInput: string): Date {
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
