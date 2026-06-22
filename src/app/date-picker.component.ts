import {
  Component,
  computed,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import {
  LucideCalendar,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronsLeft,
  LucideChevronsRight,
} from '@lucide/angular';

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  selected: boolean;
  today: boolean;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [
    LucideCalendar,
    LucideChevronDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideChevronsLeft,
    LucideChevronsRight,
  ],
  template: `
    <button
      type="button"
      class="dp-trigger"
      [class.open]="open()"
      [disabled]="disabled"
      (click)="toggle($event)"
    >
      <svg lucideCalendar size="14" class="dp-cal-icon"></svg>
      <span>{{ displayValue() }}</span>
      <svg lucideChevronDown size="13" class="dp-chevron"></svg>
    </button>

    @if (open()) {
      <div class="dp-popover" role="dialog" aria-label="Selector de fecha">
        <div class="sh-cal-text-input">
          <input
            type="text"
            placeholder="DD/MM/AAAA"
            [value]="dateText()"
            (input)="onTextInput($any($event.target).value)"
            maxlength="10"
          />
        </div>
        <div class="sh-cal-header">
          <button type="button" class="sh-cal-nav" title="Año anterior" (click)="prevYear()">
            <svg lucideChevronsLeft size="15"></svg>
          </button>
          <button type="button" class="sh-cal-nav" title="Mes anterior" (click)="prevMonth()">
            <svg lucideChevronLeft size="15"></svg>
          </button>
          <button type="button" class="sh-cal-month-btn" (click)="toggleView()">
            {{ monthLabel() }}
            <svg lucideChevronDown size="11"></svg>
          </button>
          <button type="button" class="sh-cal-nav" title="Mes siguiente" (click)="nextMonth()">
            <svg lucideChevronRight size="15"></svg>
          </button>
          <button type="button" class="sh-cal-nav" title="Año siguiente" (click)="nextYear()">
            <svg lucideChevronsRight size="15"></svg>
          </button>
        </div>
        @if (viewMode() === 'month-picker') {
          <div class="sh-month-picker">
            <div class="sh-mp-year-nav">
              <button type="button" class="sh-cal-nav" (click)="prevYear()">
                <svg lucideChevronLeft size="15"></svg>
              </button>
              <span>{{ currentMonth().getFullYear() }}</span>
              <button type="button" class="sh-cal-nav" (click)="nextYear()">
                <svg lucideChevronRight size="15"></svg>
              </button>
            </div>
            <div class="sh-mp-grid">
              @for (m of monthNames; track $index) {
                <button
                  type="button"
                  class="sh-mp-month"
                  [class.active]="$index === currentMonth().getMonth()"
                  (click)="selectMonth($index)"
                >{{ m }}</button>
              }
            </div>
          </div>
        } @else {
          <div class="sh-cal-weekdays">
            @for (d of weekdays; track d) {
              <span>{{ d }}</span>
            }
          </div>
          <div class="sh-cal-grid">
            @for (day of calendarDays(); track day.date) {
              <button
                type="button"
                class="sh-cal-day"
                [class.outside]="!day.inMonth"
                [class.selected]="day.selected"
                [class.today]="day.today"
                (click)="selectDay(day.date)"
              >{{ day.day }}</button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }

    .dp-trigger {
      display: flex;
      align-items: center;
      gap: 7px;
      width: 100%;
      min-height: 40px;
      padding: 0 10px;
      border: 1px solid rgba(24, 24, 27, 0.12);
      border-radius: 8px;
      background: #ffffff;
      color: #18181b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;

      span {
        flex: 1;
      }

      &:focus,
      &.open {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.16);
      }

      &:disabled {
        cursor: wait;
        opacity: 0.72;
      }

      .dp-cal-icon {
        flex-shrink: 0;
        color: #71717a;
      }

      .dp-chevron {
        flex-shrink: 0;
        color: #71717a;
        transition: transform 0.15s;
      }

      &.open .dp-chevron {
        transform: rotate(180deg);
      }
    }

    .dp-popover {
      position: absolute;
      left: 0;
      z-index: 50;
      margin-top: 6px;
      padding: 12px;
      width: 264px;
      border: 1px solid rgba(24, 24, 27, 0.12);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(24, 24, 27, 0.16);
    }

    .sh-cal-text-input {
      margin-bottom: 10px;

      input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid rgba(24, 24, 27, 0.15);
        border-radius: 6px;
        font-size: 0.82rem;
        color: #18181b;
        outline: none;
        box-sizing: border-box;
        min-height: unset;

        &:focus { border-color: #0f766e; box-shadow: none; }
        &::placeholder { color: #a1a1aa; }
      }
    }

    .sh-cal-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 10px;
    }

    .sh-cal-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid rgba(24, 24, 27, 0.12);
      border-radius: 6px;
      background: transparent;
      color: #71717a;
      cursor: pointer;
      padding: 0;
      flex-shrink: 0;

      &:hover {
        background: rgba(24, 24, 27, 0.05);
        color: #18181b;
      }
    }

    .sh-cal-month-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.84rem;
      font-weight: 700;
      color: #18181b;
      text-transform: capitalize;
      padding: 2px 4px;
      border-radius: 4px;

      &:hover { background: rgba(24, 24, 27, 0.06); }
    }

    .sh-cal-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 4px;

      span {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        font-size: 0.72rem;
        font-weight: 700;
        color: #71717a;
      }
    }

    .sh-cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .sh-cal-day {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      font-size: 0.8rem;
      font-weight: 500;
      color: #18181b;
      cursor: pointer;
      padding: 0;

      &:hover:not(.selected) {
        background: rgba(24, 24, 27, 0.06);
      }

      &.outside {
        color: #a1a1aa;
      }

      &.today:not(.selected) {
        background: rgba(20, 184, 166, 0.1);
        color: #0f766e;
        font-weight: 700;
      }

      &.selected {
        background: #18181b;
        color: #ffffff;
        font-weight: 700;
      }
    }

    .sh-month-picker {
      padding: 4px 0;
    }

    .sh-mp-year-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.84rem;
      font-weight: 700;
      color: #18181b;
    }

    .sh-mp-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }

    .sh-mp-month {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      border-radius: 6px;
      border: none;
      background: transparent;
      font-size: 0.78rem;
      font-weight: 500;
      color: #18181b;
      cursor: pointer;

      &:hover:not(.active) { background: rgba(24, 24, 27, 0.06); }

      &.active {
        background: #18181b;
        color: #fff;
        font-weight: 700;
      }
    }
  `],
})
export class DatePickerComponent implements OnChanges {
  private readonly el = inject(ElementRef);

  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  readonly open = signal(false);
  readonly currentMonth = signal(this.monthStart(new Date()));
  readonly viewMode = signal<'calendar' | 'month-picker'>('calendar');
  readonly dateText = signal('');

  readonly weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  private readonly monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

  readonly monthLabel = computed(() => this.monthFormatter.format(this.currentMonth()));

  readonly displayValue = computed(() => {
    if (!this.value) return 'Seleccionar fecha';
    const [y, m, d] = this.value.split('-');
    return `${d}/${m}/${y}`;
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const month = this.currentMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = this.addDays(firstDay, -startOffset);
    const today = this.toDateInput(new Date());

    return Array.from({ length: 42 }, (_, index) => {
      const date = this.addDays(start, index);
      const dateInput = this.toDateInput(date);
      return {
        date: dateInput,
        day: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        selected: dateInput === this.value,
        today: dateInput === today,
      };
    });
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value) {
      this.currentMonth.set(this.monthStart(this.parseDate(this.value)));
    }
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (!this.open()) {
      this.currentMonth.set(this.monthStart(this.value ? this.parseDate(this.value) : new Date()));
      this.viewMode.set('calendar');
      if (this.value) {
        const [y, m, d] = this.value.split('-');
        this.dateText.set(`${d}/${m}/${y}`);
      } else {
        this.dateText.set('');
      }
    }
    this.open.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  prevMonth(): void {
    const c = this.currentMonth();
    this.currentMonth.set(new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const c = this.currentMonth();
    this.currentMonth.set(new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  prevYear(): void {
    const c = this.currentMonth();
    this.currentMonth.set(new Date(c.getFullYear() - 1, c.getMonth(), 1));
  }

  nextYear(): void {
    const c = this.currentMonth();
    this.currentMonth.set(new Date(c.getFullYear() + 1, c.getMonth(), 1));
  }

  toggleView(): void {
    this.viewMode.update((v) => (v === 'calendar' ? 'month-picker' : 'calendar'));
  }

  selectMonth(monthIndex: number): void {
    const c = this.currentMonth();
    this.currentMonth.set(new Date(c.getFullYear(), monthIndex, 1));
    this.viewMode.set('calendar');
  }

  selectDay(date: string): void {
    this.valueChange.emit(date);
    this.open.set(false);
  }

  onTextInput(value: string): void {
    this.dateText.set(value);
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return;
    const [, d, m, y] = match.map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getMonth() !== m - 1) return;
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    this.valueChange.emit(iso);
    this.currentMonth.set(new Date(y, m - 1, 1));
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

  private monthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}
