import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAlertCircle, LucideX } from '@lucide/angular';
import { CalculatorEntryModalState } from './calculator.types';
import { DatePickerComponent } from './date-picker.component';

@Component({
  selector: 'app-calculator-entry-dialog',
  standalone: true,
  imports: [FormsModule, LucideX, LucideAlertCircle, DatePickerComponent],
  templateUrl: './calculator-entry-dialog.component.html',
  styleUrl: './calculator-entry-dialog.component.scss',
})
export class CalculatorEntryDialogComponent implements OnChanges {
  @Input() modal: CalculatorEntryModalState | null = null;
  @Output() save = new EventEmitter<CalculatorEntryModalState>();
  @Output() close = new EventEmitter<void>();

  form: CalculatorEntryModalState = {
    type: 'Entrada',
    date: '',
    amount: null,
    description: '',
  };

  validationError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modal'] && this.modal) {
      this.form = { ...this.modal };
      this.validationError = null;
    }
  }

  submit(): void {
    const missing: string[] = [];
    if (this.form.amount == null || this.form.amount <= 0) missing.push('Importe');
    if (!this.form.date) missing.push('Fecha');

    if (missing.length > 0) {
      this.validationError = `Campos obligatorios: ${missing.join(', ')}`;
      return;
    }

    this.validationError = null;
    this.save.emit({ ...this.form });
  }
}
