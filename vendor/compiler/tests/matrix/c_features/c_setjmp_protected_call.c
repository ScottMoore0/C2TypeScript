/* C17 §7.13 — Lua-style "protected call" wrapper.
 *
 * The canonical reusable pattern: a function takes a worker function
 * pointer + arg, wraps it in setjmp/longjmp, returns 0 on success or
 * the longjmp code on error. Models lua_pcall, libpng's setjmp guard,
 * and any "call this and tell me if it threw" API.
 */
#include <stdio.h>
#include <setjmp.h>

jmp_buf g_env;

int protected_call(void (*work)(int), int arg) {
  int rc = setjmp(g_env);
  if (rc == 0) {
    work(arg);
    return 0;  /* ran to completion */
  }
  return rc;  /* error code from longjmp */
}

void worker_ok(int x) {
  printf("ok x=%d ", x);
}

void worker_error(int x) {
  printf("about-to-fail x=%d ", x);
  longjmp(g_env, x + 100);
}

int main(void) {
  int r1 = protected_call(worker_ok, 5);
  printf("r1=%d ", r1);
  int r2 = protected_call(worker_error, 7);
  printf("r2=%d\n", r2);
  return 0;
}
