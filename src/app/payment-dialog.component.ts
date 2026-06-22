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
    value: 0,
    paymentMethod: 'Efectivo',
    date: '',
    notes: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modal'] && this.modal) {
      this.form = { ...this.modal };
    }
  }

  submit(): void {
    if (this.saving) return;
    this.save.emit({ ...this.form });
  }
}
