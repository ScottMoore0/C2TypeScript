/* Static-local across multiple call sites. */
#include <stdio.h>
int next(void) { static int c = 0; return ++c; }
int main(void) {
  for (int i = 0; i < 5; i++) printf("%d ", next());
  printf("\n");
  return 0;
}
