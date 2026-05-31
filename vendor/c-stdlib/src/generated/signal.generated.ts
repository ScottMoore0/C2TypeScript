// AUTO-GENERATED — C17 §7.14 signal constants
// Regenerate with: npx tsx compiler/scripts/build-catalogue/generate-c-stdlib-trivials.ts
// Generated: 2026-04-22T00:07:28.456Z

// BRIDGE: libc-signal

/** SIGHUP (1): Hangup */
export const SIGHUP: number = 1;
/** SIGINT (2): Interrupt (Ctrl-C) */
export const SIGINT: number = 2;
/** SIGQUIT (3): Quit */
export const SIGQUIT: number = 3;
/** SIGILL (4): Illegal instruction */
export const SIGILL: number = 4;
/** SIGTRAP (5): Trace trap */
export const SIGTRAP: number = 5;
/** SIGABRT (6): Abort */
export const SIGABRT: number = 6;
/** SIGBUS (7): Bus error */
export const SIGBUS: number = 7;
/** SIGFPE (8): Floating-point exception */
export const SIGFPE: number = 8;
/** SIGKILL (9): Killed */
export const SIGKILL: number = 9;
/** SIGUSR1 (10): User-defined signal 1 */
export const SIGUSR1: number = 10;
/** SIGSEGV (11): Segmentation fault */
export const SIGSEGV: number = 11;
/** SIGUSR2 (12): User-defined signal 2 */
export const SIGUSR2: number = 12;
/** SIGPIPE (13): Broken pipe */
export const SIGPIPE: number = 13;
/** SIGALRM (14): Alarm clock */
export const SIGALRM: number = 14;
/** SIGTERM (15): Terminate */
export const SIGTERM: number = 15;

/** Special handler values. */
export const SIG_DFL: number = 0;  // Default handling
export const SIG_IGN: number = 1;  // Ignore signal
export const SIG_ERR: number = -1; // Error return from signal()