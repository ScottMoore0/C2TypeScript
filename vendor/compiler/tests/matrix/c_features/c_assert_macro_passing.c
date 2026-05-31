/* assert that doesn't fire. */
#include <stdio.h>
#include <assert.h>
int main(void) {
  int x = 5;
  assert(x > 0);
  assert(x < 100);
  printf("ok\n");
  return 0;
}
