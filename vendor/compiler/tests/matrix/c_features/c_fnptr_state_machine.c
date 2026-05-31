/* C17 §6.7.6.3 — recursive function-pointer typedef (state machine).
 *
 * A state-machine cell that returns the next state's function pointer.
 * The typedef is self-referential: `state_fn next_state(int input)` —
 * the return type is the same fnptr type as the function itself.
 * Used by lexers, protocol parsers, network state machines.
 */
#include <stdio.h>

struct State;
typedef struct State *(*transition_fn)(int);
struct State { transition_fn next; int id; };

struct State s_start, s_mid, s_end;

struct State *to_mid(int x) { (void)x; return &s_mid; }
struct State *to_end(int x) { (void)x; return &s_end; }
struct State *stay(int x)   { (void)x; return &s_end; }

int main(void) {
  s_start.next = to_mid;  s_start.id = 1;
  s_mid.next   = to_end;  s_mid.id   = 2;
  s_end.next   = stay;    s_end.id   = 3;

  struct State *cur = &s_start;
  for (int i = 0; i < 3; i++) {
    printf("%d ", cur->id);
    cur = cur->next(0);
  }
  printf("\n");
  return 0;
}
