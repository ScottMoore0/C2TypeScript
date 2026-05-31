/* C17 §7.13.1.1 — setjmp as switch-statement controlling expression.
 *
 * Spec-allowed context (§7.13.1.1 p4: setjmp may be used as the
 * controlling expression of a selection statement). The switch
 * dispatches on the longjmp value, picking an error category.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  switch (setjmp(env)) {
    case 0:
      printf("init ");
      longjmp(env, 7);
      printf("UNREACHABLE\n");
      break;
    case 7:
      printf("seven\n");
      break;
    default:
      printf("other\n");
      break;
  }
  return 0;
}
