/* C17 §7.13 — multiple jmp_buf instances; longjmp targets the
 * specific one passed.
 *
 * Two independent error-recovery scopes (e.g., outer "transaction"
 * setjmp + inner "operation" setjmp). longjmp(inner, ...) returns
 * to the inner setjmp; longjmp(outer, ...) returns to the outer
 * setjmp without entering the inner.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf outer_env;
jmp_buf inner_env;

void inner_op(int target_outer) {
  if (setjmp(inner_env) == 0) {
    printf("inner-try ");
    if (target_outer) {
      longjmp(outer_env, 100);
    } else {
      longjmp(inner_env, 50);
    }
  } else {
    printf("inner-recover ");
  }
}

int main(void) {
  if (setjmp(outer_env) == 0) {
    inner_op(0);  /* longjmp to inner */
    inner_op(1);  /* longjmp to outer (escapes inner) */
    printf("UNREACHABLE\n");
  } else {
    printf("outer-recover\n");
  }
  return 0;
}
