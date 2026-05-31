/* C17 §6.7.6.3 + §7.14 — function pointer with reentrancy.
 *
 * The handler modifies a global state, then conditionally calls
 * itself (or a peer) by indirection. Models signal-handler chains
 * and event-bus retransmission. Verifies that the indirect call
 * site doesn't capture stale fp metadata across re-entry.
 */
#include <stdio.h>

int g_depth = 0;
int g_acc = 0;
void (*g_next)(int) = 0;

void inner(int x) { g_acc += x * 10; }

void outer(int x) {
  g_depth++;
  g_acc += x;
  if (g_next && g_depth < 3) g_next(x + 1);
  g_depth--;
}

int main(void) {
  g_next = outer;
  outer(1);  /* outer(1) → outer(2) → outer(3); accumulates 1+2+3 = 6 */
  printf("acc=%d depth=%d\n", g_acc, g_depth);

  g_next = inner;
  g_acc = 0;
  outer(5);  /* outer(5) accumulates 5, calls inner(6) → adds 60 */
  printf("acc=%d\n", g_acc);
  return 0;
}
