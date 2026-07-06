import { Component, computed, inject, signal } from '@angular/core';
import { LucideDelete, LucideTrash2 } from '@lucide/angular';
import { appSettings } from './app-settings';
import {
  CalculatorOperator,
  CalculatorState,
  initialCalculatorState,
  reduceCalculator,
} from './calculator-engine';
import { CalculatorEntryType } from './calculator.types';
import { DatePickerComponent } from './date-picker.component';
import { CalculatorEntriesStore } from './services/calculator-entries.store';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [DatePickerComponent, LucideDelete, LucideTrash2],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class CalculatorComponent {
  private readonly calculatorStore = inject(CalculatorEntriesStore);

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
  readonly entryType = signal<CalculatorEntryType>('Entrada');
  readonly entryDate = signal(this.toDateInput(new Date()));
  readonly includeInReports = signal(false);

  readonly display = computed(() => this.state().currentInput);
  readonly showClassifier = computed(
    () => this.state().justEvaluated && this.state().currentInput !== 'Error',
  );

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

  setEntryType(type: CalculatorEntryType): void {
    this.entryType.set(type);
  }

  setIncludeInReports(checked: boolean): void {
    this.includeInReports.set(checked);
  }

  saveResult(): void {
    if (!this.showClassifier()) return;

    const amount = Math.abs(Number(this.state().currentInput)) || 0;

    this.calculatorStore.add({
      id: crypto.randomUUID(),
      date: this.entryDate(),
      amount,
      type: this.entryType(),
      includeInReports: this.includeInReports(),
      expression: this.state().expression || this.state().currentInput,
      createdAt: new Date().toISOString(),
    });

    this.state.set(initialCalculatorState());
    this.entryType.set('Entrada');
    this.includeInReports.set(false);
  }

  cancelResult(): void {
    this.state.set(initialCalculatorState());
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
