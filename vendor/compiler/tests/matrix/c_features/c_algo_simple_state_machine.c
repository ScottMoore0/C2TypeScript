/* Algorithm: simple_state_machine. */
#include <stdio.h>
int main(void) {
  enum S { S_INIT, S_RUNNING, S_DONE };
  enum S s = S_INIT;
  int steps = 0;
  while (s != S_DONE) {
    if (s == S_INIT) s = S_RUNNING;
    else if (s == S_RUNNING) s = S_DONE;
    steps++;
  }
  printf("%d\n", steps);
  return 0;
}
