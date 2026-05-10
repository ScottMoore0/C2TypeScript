function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }

export let Counter = 0;
export let NumbersToFind = [0, 34, 55, 66, 32, 11, 1, 77, 888];
export function FindFunction_WhichIsBroken(NumberToFind: number): number {
  let i = 0;
  while (i <= 8) {
    i++;
  }
  if (NumbersToFind[i] == NumberToFind) {
    return i;
  }
  return 0;
}

export function FunctionWhichReturnsLocalVariable(): number {
  return Counter;
}

