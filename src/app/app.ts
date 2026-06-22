import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBadgeEuro,
  LucideCalendar,
  LucideChartNoAxesCombined,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCreditCard,
  LucideDownload,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideLockKeyhole,
  LucideLogIn,
  LucideLogOut,
  LucideMail,
  LucidePlus,
  LucideRefreshCw,
  LucideSparkles,
  LucideTable,
  LucideTrash2,
  LucideUser,
  LucideUserPlus,
  LucideWallet,
} from '@lucide/angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { appSettings, type FinanceRates } from './app-settings';
import { AuthTokenStore } from './services/auth-token.store';

type PaymentMethod = 'Efectivo' | 'Bizum' | 'Tarjeta' | 'Transferencia' | 'Otro';
type PeriodMode = 'day' | 'week' | 'month' | 'custom';
type AuthMode = 'login' | 'register';

interface FinanceCalculation {
  iva: number;
  fixedExpenses: number;
  products: number;
  salary: number;
  annualTaxReserve: number;
  totalDay: number;
}

interface PaymentEntry extends FinanceCalculation {
  id: string;
  date: string;
  clientName: string;
  value: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: 'synced' | 'local';
}

interface IncomeEntryResponse {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  vatAmount: number;
  fixedExpensesAmount: number;
  productsAmount: number;
  salaryAmount: number;
  annualTaxReserveAmount: number;
  dailyTotal: number;
  notes: string | null;
}

interface IncomeEntryRequest {
  date: string;
  clientName: string;
  amount: number;
  paymentMethod: string;
  notes?: string | null;
}

interface ReportTotals extends FinanceCalculation {
  revenue: number;
  procedures: number;
  averageTicket: number;
}

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  selected: boolean;
  today: boolean;
  total: number;
}

interface FinanceCalculationResponse {
  amount: number;
  iva: number;
  fixedExpenses: number;
  products: number;
  salary: number;
  annualTaxReserve: number;
  totalDay: number;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthSession {
  token: string;
  tokenType: string;
  user: AuthUser;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ApiErrorResponse {
  message?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Bizum', 'Tarjeta', 'Transferencia', 'Otro'];
const STORAGE_KEY = 'lari-finance-payments-v1';
const AUTH_STORAGE_KEY = 'lari-finance-auth-v1';

const PAYMENT_METHOD_ENUM: Record<PaymentMethod, string> = {
  Efectivo: 'EFECTIVO',
  Bizum: 'BIZUM',
  Tarjeta: 'TARJETA',
  Transferencia: 'TRANSFERENCIA',
  Otro: 'OTRO',
};

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    LucideBadgeEuro,
    LucideCalendar,
    LucideChartNoAxesCombined,
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideCreditCard,
    LucideDownload,
    LucideFileSpreadsheet,
    LucideFileText,
    LucideLockKeyhole,
    LucideLogIn,
    LucideLogOut,
    LucideMail,
    LucidePlus,
    LucideRefreshCw,
    LucideSparkles,
    LucideTable,
    LucideTrash2,
    LucideUser,
    LucideUserPlus,
    LucideWallet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly authTokenStore = inject(AuthTokenStore);
  private readonly financeRates = appSettings.rates;
  private readonly saveTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly moneyFormatter = new Intl.NumberFormat(appSettings.locale, {
    style: 'currency',
    currency: appSettings.currency,
  });
  private readonly compactFormatter = new Intl.NumberFormat(appSettings.locale, {
    maximumFractionDigits: 0,
  });
  private readonly dateFormatter = new Intl.DateTimeFormat(appSettings.locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  private readonly monthFormatter = new Intl.DateTimeFormat(appSettings.locale, {
    month: 'long',
    year: 'numeric',
  });

  readonly paymentMethods = PAYMENT_METHODS;
  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly heroBackgroundImage = `url("${appSettings.heroImageUrl.replaceAll('"', '\\"')}")`;
  readonly financeLabels = {
    iva: `IVA ${this.percent(this.financeRates.iva)}`,
    fixedExpenses: `Gastos fijos ${this.percent(this.financeRates.fixedExpenses)}`,
    products: `Productos ${this.percent(this.financeRates.products)}`,
    salary: `Salario ${this.percent(this.financeRates.salary)}`,
    annualTaxReserve: `Reserva impuestos ${this.percent(this.financeRates.annualTaxReserve)}`,
  };

  readonly selectedDate = signal(this.toDateInput(new Date()));
  readonly calendarMonth = signal(this.monthStart(new Date()));
  readonly periodMode = signal<PeriodMode>('day');
  readonly paymentFilter = signal<PaymentMethod | 'Todas'>('Todas');
  readonly customFrom = signal(this.toDateInput(this.addDays(new Date(), -6)));
  readonly customTo = signal(this.toDateInput(new Date()));
  readonly calendarOpen = signal(false);
  readonly popoverMonth = signal(this.monthStart(new Date()));
  readonly paymentDropdownOpen = signal(false);
  readonly apiState = signal<'online' | 'fallback'>('fallback');
  readonly entries = signal<PaymentEntry[]>(this.loadEntries());
  readonly authSession = signal<AuthSession | null>(this.loadAuthSession());
  readonly authChecking = signal(Boolean(this.authSession()?.token));
  readonly authMode = signal<AuthMode>('login');
  readonly loginForm = signal<LoginForm>({ email: '', password: '' });
  readonly registerForm = signal<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  readonly authLoading = signal(false);
  readonly loginError = signal('');

  readonly authenticated = computed(
    () => Boolean(this.authSession()?.token) && !this.authChecking(),
  );
  readonly currentUser = computed(() => this.authSession()?.user);
  readonly selectedDateLabel = computed(() => this.formatDate(this.selectedDate()));
  readonly calendarMonthLabel = computed(() => this.monthFormatter.format(this.calendarMonth()));

  readonly selectedDayEntries = computed(() =>
    this.entries()
      .filter((entry) => entry.date === this.selectedDate())
      .sort((a, b) => a.clientName.localeCompare(b.clientName, 'es')),
  );

  readonly periodRange = computed(() => {
    const selected = this.parseDate(this.selectedDate());

    if (this.periodMode() === 'week') {
      const monday = this.addDays(selected, -((selected.getDay() + 6) % 7));
      return {
        from: this.toDateInput(monday),
        to: this.toDateInput(this.addDays(monday, 6)),
      };
    }

    if (this.periodMode() === 'month') {
      return {
        from: this.toDateInput(new Date(selected.getFullYear(), selected.getMonth(), 1)),
        to: this.toDateInput(new Date(selected.getFullYear(), selected.getMonth() + 1, 0)),
      };
    }

    if (this.periodMode() === 'custom') {
      return {
        from: this.customFrom(),
        to: this.customTo(),
      };
    }

    return {
      from: this.selectedDate(),
      to: this.selectedDate(),
    };
  });

  readonly periodEntries = computed(() => {
    const { from, to } = this.periodRange();
    const payment = this.paymentFilter();

    return this.entries()
      .filter((entry) => entry.date >= from && entry.date <= to)
      .filter((entry) => payment === 'Todas' || entry.paymentMethod === payment)
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.clientName.localeCompare(b.clientName, 'es'),
      );
  });

  readonly dayTotals = computed(() => this.calculateTotals(this.selectedDayEntries()));
  readonly reportTotals = computed(() => this.calculateTotals(this.periodEntries()));

  readonly popoverMonthLabel = computed(() => this.monthFormatter.format(this.popoverMonth()));

  readonly calendarDaysPopover = computed<CalendarDay[]>(() => {
    const month = this.popoverMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = this.addDays(firstDay, -startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = this.addDays(start, index);
      const dateInput = this.toDateInput(date);

      return {
        date: dateInput,
        day: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        selected: dateInput === this.selectedDate(),
        today: dateInput === this.toDateInput(new Date()),
        total: 0,
      };
    });
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.calendarMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = this.addDays(firstDay, -startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = this.addDays(start, index);
      const dateInput = this.toDateInput(date);
      const total = this.entries()
        .filter((entry) => entry.date === dateInput)
        .reduce((sum, entry) => sum + entry.value, 0);

      return {
        date: dateInput,
        day: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        selected: dateInput === this.selectedDate(),
        today: dateInput === this.toDateInput(new Date()),
        total,
      };
    });
  });

  readonly paymentBreakdown = computed(() => {
    const total = this.reportTotals().revenue || 1;

    return PAYMENT_METHODS.map((method) => {
      const methodEntries = this.periodEntries().filter((entry) => entry.paymentMethod === method);
      const value = methodEntries.reduce((sum, entry) => sum + entry.value, 0);

      return {
        method,
        value,
        count: methodEntries.length,
        percent: Math.round((value / total) * 100),
      };
    });
  });

  readonly dailyReports = computed(() => this.groupByDate(this.periodEntries()));
  readonly weeklyReports = computed(() => this.groupByWeek(this.entries()));
  readonly monthlyReports = computed(() => this.groupByMonth(this.entries()));

  readonly topClient = computed(() => {
    const clients = new Map<string, number>();

    for (const entry of this.periodEntries()) {
      clients.set(entry.clientName, (clients.get(entry.clientName) ?? 0) + entry.value);
    }

    return [...clients.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['Sin datos', 0];
  });

  readonly periodTitle = computed(() => {
    const { from, to } = this.periodRange();
    const titles: Record<PeriodMode, string> = {
      day: 'Informe diario',
      week: 'Informe semanal',
      month: 'Informe mensual',
      custom: 'Informe por periodo',
    };

    return `${titles[this.periodMode()]} · ${this.formatDate(from)} - ${this.formatDate(to)}`;
  });

  constructor() {
    effect(() => {
      this.browserStorage()?.setItem(STORAGE_KEY, JSON.stringify(this.entries()));
    });

    if (this.authSession()?.token) {
      this.validateStoredSession();
    } else {
      this.authChecking.set(false);
    }
  }

  login(): void {
    const credentials = {
      email: this.loginForm().email.trim(),
      password: this.loginForm().password,
    };

    this.loginError.set('');

    if (!credentials.email || !credentials.password) {
      this.loginError.set('Introduce el e-mail y la contraseña para iniciar sesión.');
      return;
    }

    this.authLoading.set(true);
    this.http.post<AuthSession>(appSettings.authLoginUrl, credentials).subscribe({
      next: (session) => {
        this.authLoading.set(false);
        this.loginForm.set({ email: credentials.email, password: '' });
        this.saveAuthSession(session);
      },
      error: (error: HttpErrorResponse) => {
        this.authLoading.set(false);
        this.loginError.set(this.authErrorMessage(error));
      },
    });
  }

  register(): void {
    const form = this.registerForm();
    const registration = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    this.loginError.set('');

    if (!registration.name || !registration.email || !registration.password) {
      this.loginError.set('Introduce el nombre, el e-mail y la contraseña para crear la cuenta.');
      return;
    }

    if (registration.password.length < 8) {
      this.loginError.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (registration.password !== form.confirmPassword) {
      this.loginError.set('Las contraseñas introducidas no coinciden.');
      return;
    }

    this.authLoading.set(true);
    this.http.post<AuthSession>(appSettings.authRegisterUrl, registration).subscribe({
      next: (session) => {
        this.authLoading.set(false);
        this.loginForm.set({ email: registration.email, password: '' });
        this.registerForm.set({
          name: registration.name,
          email: registration.email,
          password: '',
          confirmPassword: '',
        });
        this.saveAuthSession(session);
      },
      error: (error: HttpErrorResponse) => {
        this.authLoading.set(false);
        this.loginError.set(this.authErrorMessage(error));
      },
    });
  }

  logout(message = ''): void {
    this.authSession.set(null);
    this.authChecking.set(false);
    this.authTokenStore.clear();
    this.browserStorage()?.removeItem(AUTH_STORAGE_KEY);
    this.apiState.set('fallback');
    this.loginForm.update((form) => ({ ...form, password: '' }));
    this.loginError.set(message);
  }

  setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
    this.loginError.set('');
  }

  updateLoginForm<K extends keyof LoginForm>(key: K, value: LoginForm[K]): void {
    this.loginForm.update((form) => ({ ...form, [key]: value }));
  }

  updateRegisterForm<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]): void {
    this.registerForm.update((form) => ({ ...form, [key]: value }));
  }

  addEntry(): void {
    const entry: PaymentEntry = {
      id: crypto.randomUUID(),
      date: this.selectedDate(),
      clientName: '',
      value: 0,
      paymentMethod: 'Efectivo',
      status: 'local',
      ...this.localCalculation(0),
    };

    this.entries.update((entries) => [entry, ...entries]);
  }

  removeEntry(id: string): void {
    const entry = this.entries().find((e) => e.id === id);

    if (entry?.status === 'synced') {
      this.http.delete(`${appSettings.entriesUrl}/${id}`).subscribe({
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
          }
        },
      });
    }

    this.entries.update((entries) => entries.filter((e) => e.id !== id));
  }

  updateEntry<K extends keyof PaymentEntry>(id: string, key: K, value: PaymentEntry[K]): void {
    this.entries.update((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)),
    );

    if (key === 'value') {
      this.calculateEntry(id, Number(value));
    } else if (key === 'paymentMethod' || key === 'date') {
      const entry = this.entries().find((e) => e.id === id);
      if (entry?.status === 'synced') {
        this.putEntry(entry);
      }
    } else if (key === 'clientName' || key === 'notes') {
      this.debounceSync(id);
    }
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.calendarMonth.set(this.monthStart(this.parseDate(date)));
    this.calendarOpen.set(false);
  }

  toggleDatePicker(): void {
    if (!this.calendarOpen()) {
      this.popoverMonth.set(this.monthStart(this.parseDate(this.selectedDate())));
    }
    this.calendarOpen.update((v) => !v);
  }

  popoverPrevMonth(): void {
    const current = this.popoverMonth();
    this.popoverMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  popoverNextMonth(): void {
    const current = this.popoverMonth();
    this.popoverMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDateFromPopover(date: string): void {
    this.selectedDate.set(date);
    this.calendarMonth.set(this.monthStart(this.parseDate(date)));
    this.calendarOpen.set(false);
  }

  setPayment(value: PaymentMethod | 'Todas'): void {
    this.paymentFilter.set(value);
    this.paymentDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-popover')) this.calendarOpen.set(false);
    if (!target.closest('.payment-dropdown-wrap')) this.paymentDropdownOpen.set(false);
  }

  setDateFromInput(date: string): void {
    if (!date) {
      return;
    }

    this.selectedDate.set(date);
    this.calendarMonth.set(this.monthStart(this.parseDate(date)));
  }

  previousMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  setPeriod(period: PeriodMode): void {
    this.periodMode.set(period);
  }

  refreshCalculations(): void {
    for (const entry of this.entries()) {
      this.calculateEntry(entry.id, entry.value);
    }
  }

  exportExcel(): void {
    const rows = this.periodEntries().map((entry) => this.exportRow(entry));
    const workbook = XLSX.utils.book_new();
    const movements = XLSX.utils.json_to_sheet(rows);
    const summary = XLSX.utils.json_to_sheet([
      {
        Informe: this.periodTitle(),
        Procedimientos: this.reportTotals().procedures,
        Ingresos: this.reportTotals().revenue,
        IVA: this.reportTotals().iva,
        'Gastos fijos': this.reportTotals().fixedExpenses,
        Productos: this.reportTotals().products,
        Salario: this.reportTotals().salary,
        'Reserva impuestos': this.reportTotals().annualTaxReserve,
        'Ticket medio': this.reportTotals().averageTicket,
      },
    ]);
    const payments = XLSX.utils.json_to_sheet(
      this.paymentBreakdown().map((item) => ({
        'Forma de pago': item.method,
        Operaciones: item.count,
        Importe: item.value,
        Porcentaje: `${item.percent}%`,
      })),
    );

    XLSX.utils.book_append_sheet(workbook, movements, 'Movimientos');
    XLSX.utils.book_append_sheet(workbook, summary, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, payments, 'Pagos');
    XLSX.writeFile(
      workbook,
      `lari-finance-${this.periodRange().from}-${this.periodRange().to}.xlsx`,
    );
  }

  exportPdf(): void {
    const document = new jsPDF({ orientation: 'landscape' });
    const totals = this.reportTotals();

    document.setFontSize(18);
    document.text('Lari Finance', 14, 18);
    document.setFontSize(10);
    document.text(this.periodTitle(), 14, 26);

    autoTable(document, {
      startY: 34,
      head: [['Métrica', 'Importe']],
      body: [
        ['Procedimientos', String(totals.procedures)],
        ['Ingresos', this.money(totals.revenue)],
        [this.financeLabels.iva, this.money(totals.iva)],
        [this.financeLabels.fixedExpenses, this.money(totals.fixedExpenses)],
        [this.financeLabels.products, this.money(totals.products)],
        [this.financeLabels.salary, this.money(totals.salary)],
        [this.financeLabels.annualTaxReserve, this.money(totals.annualTaxReserve)],
        ['Ticket medio', this.money(totals.averageTicket)],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [24, 24, 27] },
    });

    autoTable(document, {
      startY: 96,
      head: [
        ['Fecha', 'Cliente', 'Importe', 'Pago', 'IVA', 'Fijos', 'Productos', 'Salario', 'Impuestos'],
      ],
      body: this.periodEntries().map((entry) => [
        this.formatDate(entry.date),
        entry.clientName || 'Sin nombre',
        this.money(entry.value),
        entry.paymentMethod,
        this.money(entry.iva),
        this.money(entry.fixedExpenses),
        this.money(entry.products),
        this.money(entry.salary),
        this.money(entry.annualTaxReserve),
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [63, 63, 70] },
    });

    document.save(`lari-finance-${this.periodRange().from}-${this.periodRange().to}.pdf`);
  }

  money(value: number): string {
    return this.moneyFormatter.format(value || 0);
  }

  compact(value: number): string {
    return this.compactFormatter.format(value || 0);
  }

  formatDate(dateInput: string): string {
    return this.dateFormatter.format(this.parseDate(dateInput));
  }

  trackById(_: number, entry: PaymentEntry): string {
    return entry.id;
  }

  private calculateEntry(id: string, amount: number): void {
    const cleanAmount = Number.isFinite(amount) ? amount : 0;

    this.http
      .post<FinanceCalculationResponse>(appSettings.financeApiUrl, { amount: cleanAmount })
      .subscribe({
        next: (calculation) => {
          this.apiState.set('online');
          const currentStatus = this.entries().find((e) => e.id === id)?.status ?? 'local';
          this.applyCalculation(id, calculation, currentStatus);
          this.trySyncEntry(id);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
            return;
          }

          this.apiState.set('fallback');
          this.applyCalculation(id, this.localCalculation(cleanAmount), 'local');
        },
      });
  }

  private trySyncEntry(id: string): void {
    const entry = this.entries().find((e) => e.id === id);
    if (!entry || !entry.clientName.trim() || entry.value <= 0) return;

    if (entry.status === 'synced') {
      this.putEntry(entry);
    } else {
      this.postEntry(entry);
    }
  }

  private postEntry(entry: PaymentEntry): void {
    const body: IncomeEntryRequest = {
      date: entry.date,
      clientName: entry.clientName.trim(),
      amount: entry.value,
      paymentMethod: PAYMENT_METHOD_ENUM[entry.paymentMethod],
      notes: entry.notes ?? null,
    };

    this.http.post<IncomeEntryResponse>(appSettings.entriesUrl, body).subscribe({
      next: (response) => {
        this.entries.update((entries) =>
          entries.map((e) =>
            e.id === entry.id ? { ...this.mapIncomeEntryResponse(response), status: 'synced' } : e,
          ),
        );
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
        }
      },
    });
  }

  private putEntry(entry: PaymentEntry): void {
    const body: IncomeEntryRequest = {
      date: entry.date,
      clientName: entry.clientName.trim() || 'Sin nombre',
      amount: entry.value > 0 ? entry.value : 0.01,
      paymentMethod: PAYMENT_METHOD_ENUM[entry.paymentMethod],
      notes: entry.notes ?? null,
    };

    this.http.put<IncomeEntryResponse>(`${appSettings.entriesUrl}/${entry.id}`, body).subscribe({
      next: (response) => {
        this.entries.update((entries) =>
          entries.map((e) =>
            e.id === entry.id ? { ...this.mapIncomeEntryResponse(response), status: 'synced' } : e,
          ),
        );
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
        }
      },
    });
  }

  private debounceSync(id: string): void {
    const timeout = this.saveTimeouts.get(id);
    if (timeout !== undefined) clearTimeout(timeout);

    this.saveTimeouts.set(
      id,
      setTimeout(() => {
        this.saveTimeouts.delete(id);
        const entry = this.entries().find((e) => e.id === id);
        if (entry?.status === 'synced') {
          this.putEntry(entry);
        }
      }, 500),
    );
  }

  private mapIncomeEntryResponse(r: IncomeEntryResponse): PaymentEntry {
    return {
      id: r.id,
      date: r.date,
      clientName: r.clientName,
      value: Number(r.amount),
      paymentMethod: r.paymentMethodLabel as PaymentMethod,
      notes: r.notes ?? undefined,
      iva: Number(r.vatAmount),
      fixedExpenses: Number(r.fixedExpensesAmount),
      products: Number(r.productsAmount),
      salary: Number(r.salaryAmount),
      annualTaxReserve: Number(r.annualTaxReserveAmount),
      totalDay: Number(r.dailyTotal),
      status: 'synced',
    };
  }

  private applyCalculation(
    id: string,
    calculation: FinanceCalculation,
    status: PaymentEntry['status'],
  ): void {
    this.entries.update((entries) =>
      entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...calculation,
              status,
            }
          : entry,
      ),
    );
  }

  private calculateTotals(entries: PaymentEntry[]): ReportTotals {
    const totals = entries.reduce(
      (acc, entry) => ({
        revenue: acc.revenue + entry.value,
        iva: acc.iva + entry.iva,
        fixedExpenses: acc.fixedExpenses + entry.fixedExpenses,
        products: acc.products + entry.products,
        salary: acc.salary + entry.salary,
        annualTaxReserve: acc.annualTaxReserve + entry.annualTaxReserve,
        totalDay: acc.totalDay + entry.totalDay,
        procedures: acc.procedures + 1,
      }),
      {
        revenue: 0,
        iva: 0,
        fixedExpenses: 0,
        products: 0,
        salary: 0,
        annualTaxReserve: 0,
        totalDay: 0,
        procedures: 0,
      },
    );

    return {
      ...totals,
      averageTicket: totals.procedures ? totals.revenue / totals.procedures : 0,
    };
  }

  private groupByDate(entries: PaymentEntry[]) {
    const groups = new Map<string, PaymentEntry[]>();

    for (const entry of entries) {
      groups.set(entry.date, [...(groups.get(entry.date) ?? []), entry]);
    }

    return [...groups.entries()].map(([date, dateEntries]) => ({
      label: this.formatDate(date),
      total: this.calculateTotals(dateEntries),
    }));
  }

  private groupByWeek(entries: PaymentEntry[]) {
    const groups = new Map<string, PaymentEntry[]>();

    for (const entry of entries) {
      const date = this.parseDate(entry.date);
      const monday = this.addDays(date, -((date.getDay() + 6) % 7));
      const sunday = this.addDays(monday, 6);
      const label = `${this.formatDate(this.toDateInput(monday))} - ${this.formatDate(this.toDateInput(sunday))}`;
      groups.set(label, [...(groups.get(label) ?? []), entry]);
    }

    return [...groups.entries()].map(([label, weekEntries]) => ({
      label,
      total: this.calculateTotals(weekEntries),
    }));
  }

  private groupByMonth(entries: PaymentEntry[]) {
    const groups = new Map<string, PaymentEntry[]>();

    for (const entry of entries) {
      const date = this.parseDate(entry.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }

    return [...groups.entries()].map(([key, monthEntries]) => {
      const [year, month] = key.split('-').map(Number);

      return {
        label: this.monthFormatter.format(new Date(year, month, 1)),
        total: this.calculateTotals(monthEntries),
      };
    });
  }

  private exportRow(entry: PaymentEntry) {
    return {
      Fecha: entry.date,
      'Nombre de la clienta': entry.clientName,
      Importe: entry.value,
      'Forma de pago': entry.paymentMethod,
      [this.financeLabels.iva]: entry.iva,
      [this.financeLabels.fixedExpenses]: entry.fixedExpenses,
      [this.financeLabels.products]: entry.products,
      [this.financeLabels.salary]: entry.salary,
      [this.financeLabels.annualTaxReserve]: entry.annualTaxReserve,
      'Total del día': entry.totalDay,
    };
  }

  private localCalculation(amount: number): FinanceCalculation {
    const round = (value: number) => Math.round(value * 100) / 100;

    return {
      iva: round(amount * this.financeRates.iva),
      fixedExpenses: round(amount * this.financeRates.fixedExpenses),
      products: round(amount * this.financeRates.products),
      salary: round(amount * this.financeRates.salary),
      annualTaxReserve: round(amount * this.financeRates.annualTaxReserve),
      totalDay: round(amount),
    };
  }

  private percent(value: FinanceRates[keyof FinanceRates]): string {
    return `${this.compactFormatter.format(value * 100)}%`;
  }

  private saveAuthSession(session: AuthSession): void {
    this.authSession.set(session);
    this.authChecking.set(false);
    this.authTokenStore.set(session.token, session.tokenType || 'Bearer');
    this.browserStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    this.loadEntriesFromApi();
  }

  private validateStoredSession(): void {
    const session = this.authSession();

    if (!session?.token) {
      this.logout();
      return;
    }

    this.authTokenStore.set(session.token, session.tokenType || 'Bearer');

    this.http.get<FinanceRates>(appSettings.financeRatesUrl).subscribe({
      next: () => {
        this.authChecking.set(false);
        this.apiState.set('online');
        this.loadEntriesFromApi();
      },
      error: () => {
        this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
      },
    });
  }

  private loadEntriesFromApi(): void {
    this.http.get<IncomeEntryResponse[]>(appSettings.entriesUrl).subscribe({
      next: (apiEntries) => {
        this.entries.set(apiEntries.map((r) => this.mapIncomeEntryResponse(r)));
        this.apiState.set('online');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.logout('Sesión caducada. Inicia sesión de nuevo para continuar.');
        }
      },
    });
  }

  private loadAuthSession(): AuthSession | null {
    try {
      const stored = this.browserStorage()?.getItem(AUTH_STORAGE_KEY);
      const session = stored ? (JSON.parse(stored) as AuthSession) : null;

      return session?.token ? session : null;
    } catch {
      return null;
    }
  }

  private authErrorMessage(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;

    if (apiError?.message) {
      return apiError.message;
    }

    if (error.status === 0) {
      return 'No se ha podido conectar con la API. Comprueba que esté online.';
    }

    return 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
  }

  private loadEntries(): PaymentEntry[] {
    const today = this.toDateInput(new Date());
    const yesterday = this.toDateInput(this.addDays(new Date(), -1));
    const previousWeek = this.toDateInput(this.addDays(new Date(), -5));
    const sampleEntries: PaymentEntry[] = [
      this.createSampleEntry(today, 'María López', 38, 'Tarjeta'),
      this.createSampleEntry(today, 'Carmen Ruiz', 24, 'Bizum'),
      this.createSampleEntry(yesterday, 'Lucía Martín', 42, 'Efectivo'),
      this.createSampleEntry(previousWeek, 'Ana Sánchez', 35, 'Transferencia'),
    ];

    try {
      const stored = this.browserStorage()?.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PaymentEntry[]) : sampleEntries;
    } catch {
      return sampleEntries;
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

  private createSampleEntry(
    date: string,
    clientName: string,
    value: number,
    paymentMethod: PaymentMethod,
  ): PaymentEntry {
    return {
      id: crypto.randomUUID(),
      date,
      clientName,
      value,
      paymentMethod,
      status: 'local',
      ...this.localCalculation(value),
    };
  }

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
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

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }
}
