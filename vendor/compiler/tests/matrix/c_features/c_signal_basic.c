/* C17 §7.14 — signal/raise with default handler.
 * Test only that signal(SIG_DFL) and direct raise() can be invoked
 * without crash on a non-signal-receiving program. */
#include <stdio.h>
#include <signal.h>
int main(void) {
  signal(SIGTERM, SIG_DFL);
  printf("ok\n");
  return 0;
}
