export type CalculatorOperator = '+' | '−' | '×' | '÷';

export interface CalculatorState {
  previousValue: number | null;
  pendingOperator: CalculatorOperator | null;
  currentInput: string;
  justEvaluated: boolean;
  expression: string;
}

export type CalculatorAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'operator'; operator: CalculatorOperator }
  | { type: 'percent' }
  | { type: 'equals' }
  | { type: 'backspace' }
  | { type: 'clear' };

export function initialCalculatorState(): CalculatorState {
  return {
    previousValue: null,
    pendingOperator: null,
    currentInput: '0',
    justEvaluated: false,
    expression: '',
  };
}

export function reduceCalculator(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'digit':
      return applyDigit(state, action.digit);
    case 'decimal':
      return applyDecimal(state);
    case 'operator':
      return applyOperator(state, action.operator);
    case 'percent':
      return applyPercent(state);
    case 'equals':
      return applyEquals(state);
    case 'backspace':
      return applyBackspace(state);
    case 'clear':
      return initialCalculatorState();
  }
}

function applyDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.justEvaluated || state.currentInput === 'Error') {
    return { ...initialCalculatorState(), currentInput: digit };
  }
  if (state.currentInput === '0') {
    return { ...state, currentInput: digit };
  }
  return { ...state, currentInput: state.currentInput + digit };
}

function applyDecimal(state: CalculatorState): CalculatorState {
  if (state.justEvaluated || state.currentInput === 'Error') {
    return { ...initialCalculatorState(), currentInput: '0.' };
  }
  if (state.currentInput.includes('.')) {
    return state;
  }
  return { ...state, currentInput: `${state.currentInput}.` };
}

// Sequential left-to-right evaluation, no operator precedence — matches a
// physical calculator, so "12 + 8 × 2 =" yields 40, not 28.
function applyOperator(state: CalculatorState, operator: CalculatorOperator): CalculatorState {
  if (state.currentInput === 'Error') {
    return state;
  }

  const inputValue = Number(state.currentInput);

  if (state.previousValue !== null && state.pendingOperator !== null && !state.justEvaluated) {
    const result = compute(state.previousValue, inputValue, state.pendingOperator);
    if (Number.isNaN(result)) {
      return { previousValue: null, pendingOperator: null, currentInput: 'Error', justEvaluated: true, expression: '' };
    }
    return {
      previousValue: result,
      pendingOperator: operator,
      currentInput: '0',
      justEvaluated: false,
      expression: `${state.expression} ${formatOperand(inputValue)} ${operator}`,
    };
  }

  return {
    previousValue: inputValue,
    pendingOperator: operator,
    currentInput: '0',
    justEvaluated: false,
    expression: `${formatOperand(inputValue)} ${operator}`,
  };
}

// Two rules: standalone (÷100) and relative-to-previous-value when an
// operator is pending, e.g. "200 + 10% " primes 20 as the next operand.
function applyPercent(state: CalculatorState): CalculatorState {
  if (state.currentInput === 'Error') {
    return state;
  }

  const inputValue = Number(state.currentInput);

  if (state.pendingOperator !== null && state.previousValue !== null) {
    return { ...state, currentInput: formatOperand(roundResult(state.previousValue * (inputValue / 100))) };
  }

  return { ...state, currentInput: formatOperand(roundResult(inputValue / 100)) };
}

function applyEquals(state: CalculatorState): CalculatorState {
  if (state.currentInput === 'Error') {
    return state;
  }
  if (state.pendingOperator === null || state.previousValue === null) {
    return { ...state, justEvaluated: true };
  }

  const inputValue = Number(state.currentInput);
  const result = compute(state.previousValue, inputValue, state.pendingOperator);

  if (Number.isNaN(result)) {
    return { previousValue: null, pendingOperator: null, currentInput: 'Error', justEvaluated: true, expression: '' };
  }

  return {
    previousValue: null,
    pendingOperator: null,
    currentInput: formatOperand(result),
    justEvaluated: true,
    expression: `${state.expression} ${formatOperand(inputValue)} =`,
  };
}

function applyBackspace(state: CalculatorState): CalculatorState {
  if (state.justEvaluated || state.currentInput === 'Error') {
    return state;
  }
  if (state.currentInput.length <= 1) {
    return { ...state, currentInput: '0' };
  }
  return { ...state, currentInput: state.currentInput.slice(0, -1) };
}

function compute(a: number, b: number, operator: CalculatorOperator): number {
  switch (operator) {
    case '+':
      return roundResult(a + b);
    case '−':
      return roundResult(a - b);
    case '×':
      return roundResult(a * b);
    case '÷':
      return b === 0 ? NaN : roundResult(a / b);
  }
}

// Kills float artifacts like 0.1 + 0.2 === 0.30000000000000004.
function roundResult(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

function formatOperand(value: number): string {
  return String(value);
}
