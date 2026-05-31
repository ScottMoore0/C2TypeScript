/* C17 §7.13.2.1 p3 — longjmp(env, 0) causes setjmp to return 1.
 *
 * Spec edge case: passing 0 as the value would collide with the
 * initial-call return convention, so it's redirected to 1. Codebases
 * that expect this guarantee (Lua, libpng) rely on it.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  int rc = setjmp(env);
  if (rc == 0) {
    longjmp(env, 0);  /* spec: setjmp returns 1, not 0 */
  }
  printf("rc=%d\n", rc);  /* expect rc=1 */
  return 0;
}
