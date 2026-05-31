/* C17 §6.5.9 + §6.7.6.3 — function-pointer comparison.
 *
 * fp == NULL is the canonical "is callback registered?" check; without
 * it, any optional-callback API (signal handlers, event hooks, plugin
 * dispatch tables) cannot guard the call site safely.
 */
#include <stdio.h>

int handler(int x) { return x * 2; }

int main(void) {
  int (*fp)(int) = 0;
  if (fp == 0) printf("null ");
  fp = handler;
  if (fp != 0) printf("set ");
  printf("v=%d\n", fp(7));
  return 0;
}
