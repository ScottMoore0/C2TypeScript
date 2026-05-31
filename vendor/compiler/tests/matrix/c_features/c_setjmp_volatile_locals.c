/* C17 §7.13.2.1 p3 — locals declared volatile retain their last
 * stored value across longjmp; non-volatile locals modified between
 * setjmp and longjmp have indeterminate values.
 *
 * The spec-mandated escape hatch for preserving state across the
 * non-local jump. Codebases tag tracked state with `volatile`.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  volatile int counter = 0;
  int rc = setjmp(env);
  if (rc == 0) {
    counter = 10;
    longjmp(env, 1);
  } else {
    counter = counter + 5;  /* 10 + 5 = 15 */
    printf("counter=%d rc=%d\n", counter, rc);
  }
  return 0;
}
