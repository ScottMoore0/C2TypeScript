/* C17 §6.7.6.3 + §6.7.6.3 p15 — function pointer to variadic
 * function. printf-family wrappers and logging frameworks (zlog,
 * GLib's g_log) take fp-to-vprintf-like signatures.
 */
#include <stdio.h>
#include <stdarg.h>

int sum_n(int n, ...) {
  va_list ap;
  va_start(ap, n);
  int total = 0;
  for (int i = 0; i < n; i++) total += va_arg(ap, int);
  va_end(ap);
  return total;
}

int main(void) {
  int (*fp)(int, ...) = sum_n;
  int r = fp(4, 1, 2, 3, 4);
  printf("r=%d\n", r);
  return 0;
}
