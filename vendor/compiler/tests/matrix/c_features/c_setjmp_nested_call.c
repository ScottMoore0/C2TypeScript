/* C17 §7.13.2 — longjmp from a nested call frame.
 *
 * The canonical error-recovery pattern: setjmp at the top, deep
 * call stack, longjmp from the innermost layer to abort directly
 * to the recovery point. Used by Lua's protected calls, libpng's
 * error_fn, regex backtracking.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf env;

void deepest(int code) {
  printf("deepest ");
  longjmp(env, code);
  printf("UNREACHABLE\n");
}

void mid(int code) {
  printf("mid ");
  deepest(code);
  printf("UNREACHABLE\n");
}

void outer(int code) {
  printf("outer ");
  mid(code);
  printf("UNREACHABLE\n");
}

int main(void) {
  int rc = setjmp(env);
  if (rc == 0) {
    outer(7);
    printf("UNREACHABLE\n");
  } else {
    printf("recovered rc=%d\n", rc);
  }
  return 0;
}
