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

  it('reveals the classifier panel after pressing equals', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;
    expect(component.showClassifier()).toBe(false);

    component.pressDigit('5');
    component.pressOperator('+');
    component.pressDigit('3');
    component.pressEquals();

    expect(component.display()).toBe('8');
    expect(component.showClassifier()).toBe(true);
  });

  it('saveResult() adds an entry to the history and resets the display', () => {
    const fixture = TestBed.createComponent(CalculatorComponent);
    const component = fixture.componentInstance;

    component.pressDigit('1');
    component.pressDigit('0');
    component.pressEquals();
    component.setEntryType('Salida');
    component.saveResult();

    expect(component.history().length).toBe(1);
    expect(component.history()[0].amount).toBe(10);
    expect(component.history()[0].type).toBe('Salida');
    expect(component.display()).toBe('0');
    expect(component.showClassifier()).toBe(false);
  });
});
