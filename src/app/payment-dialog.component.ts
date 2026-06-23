import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAlertCircle, LucideLoaderCircle, LucideX } from '@lucide/angular';
import { DatePickerComponent } from './date-picker.component';
import { PaySelectComponent } from './pay-select.component';
import { EntryModalState, PaymentMethod } from './payment.types';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [FormsModule, LucideX, LucideAlertCircle, LucideLoaderCircle, PaySelectComponent, DatePickerComponent],
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent implements OnChanges {
  @Input() modal: EntryModalState | null = null;
  @Input() paymentMethods: PaymentMethod[] = [];
  @Input() saving = false;
  @Input() error: string | null = null;
  @Output() save = new EventEmitter<EntryModalState>();
  @Output() close = new EventEmitter<void>();

  form: EntryModalState = {
    mode: 'create',
    id: '',
    clientName: '',
    value: null,
    paymentMethod: 'Efectivo',
    date: '',
    notes: '',
  };

  validationError: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modal'] && this.modal) {
      this.form = { ...this.modal };
      this.validationError = null;
    }
  }

  submit(): void {
    if (this.saving) return;

    const missing: string[] = [];
    if (!this.form.clientName?.trim()) missing.push('Nombre de la clienta');
    if (this.form.value == null || this.form.value <= 0) missing.push('Importe');
    if (!this.form.date) missing.push('Fecha');

    if (missing.length > 0) {
      this.validationError = `Campos obligatorios: ${missing.join(', ')}`;
      return;
    }

    this.validationError = null;
    this.save.emit({ ...this.form });
  }
}
