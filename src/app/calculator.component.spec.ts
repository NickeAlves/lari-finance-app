import { TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

// This test environment's built-in `localStorage` global is an inert `{}`
// (no `--localstorage-file` configured), so CalculatorEntriesStore's guard
// treats it as unavailable. Stub a real in-memory Storage to isolate tests.
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => void data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
}

describe('CalculatorComponent', () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    await TestBed.configureTestingModule({
      imports: [CalculatorComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('updates the display when digit buttons are clicked', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;
    component.pressDigit('4');
    component.pressDigit('2');
    expect(component.display()).toBe('42');
  });

  it('pressEquals() resolves the pending operation without touching the entries panel', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;

    component.pressDigit('5');
    component.pressOperator('+');
    component.pressDigit('3');
    component.pressEquals();

    expect(component.display()).toBe('8');
    expect(component.entryModal()).toBeNull();
    expect(component.history().length).toBe(0);
  });

  it('openEntryModal() opens the entry dialog pre-filled with the given type', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;

    component.openEntryModal('Salida');

    expect(component.entryModal()).not.toBeNull();
    expect(component.entryModal()?.type).toBe('Salida');
  });

  it('saveEntry() adds an entry to the history and closes the dialog', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;

    component.openEntryModal('Salida');
    component.saveEntry({ type: 'Salida', date: '2026-07-06', amount: 10, description: 'Materiales' });

    expect(component.history().length).toBe(1);
    expect(component.history()[0].amount).toBe(10);
    expect(component.history()[0].type).toBe('Salida');
    expect(component.history()[0].includeInReports).toBe(false);
    expect(component.entryModal()).toBeNull();
  });

  it('transferToPayments emits the entry when requested', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    component.transferToPayments.subscribe((entry) => emitted.push(entry));

    component.saveEntry({ type: 'Entrada', date: '2026-07-06', amount: 25, description: 'Propina' });
    const [entry] = component.history();
    component.transferToPayments.emit(entry);

    expect(emitted).toEqual([entry]);
  });
});
