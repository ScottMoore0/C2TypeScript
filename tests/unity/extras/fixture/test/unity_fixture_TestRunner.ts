function __safe_div(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return Math.trunc(a / b); }
function __safe_mod(a: number, b: number): number { if (b === 0) throw new Error('Division by zero'); return a % b; }

export function TEST_GROUP_RUNNER(UnityFixture: number): number {
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
  RUN_TEST_CASE(UnityFixture);
}

export function TEST_GROUP_RUNNER_1(UnityCommandOptions: number): number {
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
  RUN_TEST_CASE(UnityCommandOptions);
}

export function TEST_GROUP_RUNNER_2(LeakDetection: number): number {
  RUN_TEST_CASE(LeakDetection);
  RUN_TEST_CASE(LeakDetection);
  RUN_TEST_CASE(LeakDetection);
  RUN_TEST_CASE(LeakDetection);
  RUN_TEST_CASE(LeakDetection);
  RUN_TEST_CASE(LeakDetection);
}

export function TEST_GROUP_RUNNER_3(InternalMalloc: number): number {
  RUN_TEST_CASE(InternalMalloc);
  RUN_TEST_CASE(InternalMalloc);
  RUN_TEST_CASE(InternalMalloc);
  RUN_TEST_CASE(InternalMalloc);
}

