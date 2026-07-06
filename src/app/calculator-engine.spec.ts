import { initialCalculatorState, reduceCalculator, type CalculatorState } from './calculator-engine';

function type(state: CalculatorState, keys: string): CalculatorState {
  return keys.split(' ').reduce((current, key) => {
    if (/^\d$/.test(key)) return reduceCalculator(current, { type: 'digit', digit: key });
    if (key === '.') return reduceCalculator(current, { type: 'decimal' });
    if (key === '=') return reduceCalculator(current, { type: 'equals' });
    if (key === '%') return reduceCalculator(current, { type: 'percent' });
    if (key === '+' || key === '−' || key === '×' || key === '÷') {
      return reduceCalculator(current, { type: 'operator', operator: key });
    }
    throw new Error(`Unsupported key in test helper: ${key}`);
  }, state);
}

describe('calculator-engine', () => {
  it('builds multi-digit numbers without leading zeros', () => {
    let state = initialCalculatorState();
    state = reduceCalculator(state, { type: 'digit', digit: '0' });
    state = reduceCalculator(state, { type: 'digit', digit: '5' });
    expect(state.currentInput).toBe('5');
    state = reduceCalculator(state, { type: 'digit', digit: '2' });
    expect(state.currentInput).toBe('52');
  });

  it('guards against a second decimal point', () => {
    let state = initialCalculatorState();
    state = type(state, '1 2 . 5 .');
    expect(state.currentInput).toBe('12.5');
  });

  it('evaluates sequentially with no operator precedence', () => {
    const state = type(initialCalculatorState(), '1 2 + 8 × 2 =');
    expect(state.currentInput).toBe('40');
    expect(state.expression).toBe('12 + 8 × 2 =');
  });

  it('applies percent relative to the previous value when an operator is pending', () => {
    const state = type(initialCalculatorState(), '2 0 0 + 1 0 % =');
    expect(state.currentInput).toBe('220');
  });

  it('applies percent standalone (divide by 100) with no pending operator', () => {
    const state = type(initialCalculatorState(), '5 0 %');
    expect(state.currentInput).toBe('0.5');
  });

  it('is a no-op on equals with no pending operator', () => {
    let state = type(initialCalculatorState(), '7');
    state = reduceCalculator(state, { type: 'equals' });
    expect(state.currentInput).toBe('7');
    expect(state.justEvaluated).toBe(true);
  });

  it('produces Error on division by zero and fully resets on the next digit', () => {
    let state = type(initialCalculatorState(), '5 ÷ 0 =');
    expect(state.currentInput).toBe('Error');
    state = reduceCalculator(state, { type: 'digit', digit: '3' });
    expect(state.currentInput).toBe('3');
    expect(state.previousValue).toBeNull();
    expect(state.pendingOperator).toBeNull();
  });

  it('backspace removes the last character but no-ops right after equals', () => {
    let state = type(initialCalculatorState(), '1 2 3');
    state = reduceCalculator(state, { type: 'backspace' });
    expect(state.currentInput).toBe('12');

    state = type(state, '=');
    const afterEquals = state.currentInput;
    state = reduceCalculator(state, { type: 'backspace' });
    expect(state.currentInput).toBe(afterEquals);
  });

  it('clear fully resets to the initial state', () => {
    let state = type(initialCalculatorState(), '1 2 + 8');
    state = reduceCalculator(state, { type: 'clear' });
    expect(state).toEqual(initialCalculatorState());
  });

  it('rounds away floating point artifacts', () => {
    const state = type(initialCalculatorState(), '0 . 1 + 0 . 2 =');
    expect(state.currentInput).toBe('0.3');
  });
});
