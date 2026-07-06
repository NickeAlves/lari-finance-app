export type PaymentMethod = 'Efectivo' | 'Bizum' | 'Tarjeta' | 'Transferencia' | 'Otro';

export type ChangeMethod = 'Efectivo' | 'Bizum';

export interface EntryModalState {
  mode: 'create' | 'edit';
  id: string;
  clientName: string;
  value: number | null;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
  changeGiven: boolean;
  changeMethod: ChangeMethod | null;
}
