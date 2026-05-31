/* C17 §7.13 — repeated longjmp to the same setjmp point (retry loop).
 *
 * setjmp is conceptually called once but its "return" point is
 * re-entered each time longjmp targets it. Used by parsers that
 * retry on recoverable errors and shells that loop on each command.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  int counter = 0;
  int rc = setjmp(env);
  /* rc is 0 the first time, then 1, 2, 3 on each longjmp re-entry */
  printf("rc=%d ", rc);
  counter++;
  if (counter < 4) {
    longjmp(env, counter);
  }
  printf("done counter=%d\n", counter);
  return 0;
}
