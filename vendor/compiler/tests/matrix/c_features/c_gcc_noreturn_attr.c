/* GCC noreturn attribute — function never returns (calls exit, longjmp,
 * abort, infinite loop). Used in error paths. Compiler uses it to
 * suppress "missing return" warnings; runtime semantic is the function
 * doesn't return.
 */
#include <stdio.h>
#include <stdlib.h>

__attribute__((noreturn))
static void die(const char *msg) {
  printf("die: %s\n", msg);
  exit(0);
}

int main(void) {
  printf("before-die\n");
  die("oops");
  printf("UNREACHABLE\n"); /* should never run */
  return 1;
}
