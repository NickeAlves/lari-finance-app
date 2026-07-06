export type CalculatorEntryType = 'Entrada' | 'Salida';

export interface CalculatorEntry {
  id: string;
  date: string;
  amount: number;
  type: CalculatorEntryType;
  includeInReports: boolean;
  expression?: string;
  createdAt: string;
}
