export type PaymentMethod = 'Efectivo' | 'Bizum' | 'Tarjeta' | 'Transferencia' | 'Otro';

export interface EntryModalState {
  mode: 'create' | 'edit';
  id: string;
  clientName: string;
  value: number | null;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
}
