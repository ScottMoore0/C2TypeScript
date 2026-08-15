function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }

let data = -1;
export function TEST_SETUP(mygroup: number): number {
  data = 0;
}

export function TEST_TEAR_DOWN(mygroup: number): number {
  data = -1;
}

export function TEST(mygroup: number, test1: number): number {
  TEST_ASSERT_EQUAL_INT(0, data);
}

export function TEST_1(mygroup: number, test2: number): number {
  TEST_ASSERT_EQUAL_INT(0, data);
  data = 5;
}

export function TEST_2(mygroup: number, test3: number): number {
  data = 7;
  TEST_ASSERT_EQUAL_INT(7, data);
}

