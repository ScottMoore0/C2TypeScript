/* C17 §7.13.1.1 — setjmp used directly as the controlling expression
 * of an if-statement.
 *
 * One of the four spec-allowed contexts. Common idiom:
 *   if (setjmp(env)) { error_path(); } else { try_path(); }
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

int main(void) {
  if (setjmp(env)) {
    printf("error path\n");
    return 0;
  } else {
    printf("try path ");
    longjmp(env, 1);
    printf("UNREACHABLE\n");
  }
}
