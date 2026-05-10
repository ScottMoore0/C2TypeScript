function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }

export function setUp(): void {
}

export function tearDown(): void {
}

export function test_IgnoredTest(): void {
  TEST_IGNORE_MESSAGE("This Test Was Ignored On Purpose");
}

export function test_AnotherIgnoredTest(): void {
  TEST_IGNORE_MESSAGE("These Can Be Useful For Leaving Yourself Notes On What You Need To Do Yet");
}

export function test_ThisFunctionHasNotBeenTested_NeedsToBeImplemented(): void {
  TEST_IGNORE();
}

