/* `const int *const p` — both target and pointer are const. */
#include <stdio.h>
int main(void) {
  int x = 42;
  const int *const p = &x;
  printf("%d\n", *p);
  return 0;
}
