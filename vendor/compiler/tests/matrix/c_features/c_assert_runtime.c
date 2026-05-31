/* Runtime assert (passing). */
#include <stdio.h>
#include <assert.h>
int main(void) {
  int x = 10;
  assert(x > 0 && x < 100);
  printf("ok\n");
  return 0;
}
