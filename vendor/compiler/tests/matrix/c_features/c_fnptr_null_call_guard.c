/* C17 §6.5.2.2 + §6.5.9 — guarded indirect call.
 *
 * The library-author idiom: "call the user's hook only if they
 * registered one". Behaviour must match: branches not taken
 * leave no observable side effects.
 */
#include <stdio.h>

void (*g_hook)(int) = 0;
int g_called = 0;

void real_hook(int x) { g_called = x; }

void maybe_call(int v) {
  if (g_hook) g_hook(v);
}

int main(void) {
  maybe_call(7);  /* hook is null, must NOT call */
  printf("after-null: %d\n", g_called);

  g_hook = real_hook;
  maybe_call(42);
  printf("after-set: %d\n", g_called);

  g_hook = 0;
  maybe_call(99);  /* re-cleared, must NOT call */
  printf("after-clear: %d\n", g_called);
  return 0;
}
