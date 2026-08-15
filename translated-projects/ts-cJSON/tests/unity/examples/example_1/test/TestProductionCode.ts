import { Counter, FindFunction_WhichIsBroken, FunctionWhichReturnsLocalVariable } from './ProductionCode.js';

function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }

export function setUp(): void {
  Counter = 23130;
}

export function tearDown(): void {
}

export function test_FindFunction_WhichIsBroken_ShouldReturnZeroIfItemIsNotInList_WhichWorksEvenInOurBrokenCode(): void {
  TEST_ASSERT_EQUAL(0, FindFunction_WhichIsBroken(78));
  TEST_ASSERT_EQUAL(0, FindFunction_WhichIsBroken(1));
  TEST_ASSERT_EQUAL(0, FindFunction_WhichIsBroken(33));
  TEST_ASSERT_EQUAL(0, FindFunction_WhichIsBroken(999));
  TEST_ASSERT_EQUAL(0, FindFunction_WhichIsBroken(-1));
}

export function test_FindFunction_WhichIsBroken_ShouldReturnTheIndexForItemsInList_WhichWillFailBecauseOurFunctionUnderTestIsBroken(): void {
  TEST_ASSERT_EQUAL(1, FindFunction_WhichIsBroken(34));
  TEST_ASSERT_EQUAL(8, FindFunction_WhichIsBroken(8888));
}

export function test_FunctionWhichReturnsLocalVariable_ShouldReturnTheCurrentCounterValue(): void {
  TEST_ASSERT_EQUAL_HEX(23130, FunctionWhichReturnsLocalVariable());
  Counter = 4660;
  TEST_ASSERT_EQUAL_HEX(4660, FunctionWhichReturnsLocalVariable());
}

export function test_FunctionWhichReturnsLocalVariable_ShouldReturnTheCurrentCounterValueAgain(): void {
  TEST_ASSERT_EQUAL_HEX(23130, FunctionWhichReturnsLocalVariable());
}

export function test_FunctionWhichReturnsLocalVariable_ShouldReturnCurrentCounter_ButFailsBecauseThisTestIsActuallyFlawed(): void {
  TEST_ASSERT_EQUAL_HEX(4660, FunctionWhichReturnsLocalVariable());
}

