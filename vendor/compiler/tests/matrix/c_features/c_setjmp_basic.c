/* C17 §7.13.1 + §7.13.2 — basic setjmp/longjmp.
 *
 * Spec contract: setjmp returns 0 the first time; after longjmp(env, v)
 * with v != 0, control resumes at the setjmp call and it returns v.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  int rc = setjmp(env);
  if (rc == 0) {
    printf("first ");
    longjmp(env, 42);
    printf("UNREACHABLE\n");
  } else {
    printf("second rc=%d\n", rc);
  }
  return 0;
}
