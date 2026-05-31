/* strcmp("hello", "hello"). */
#include <stdio.h>
#include <string.h>
int main(void) {
  int r = strcmp("hello", "hello");
  printf("%d\n", r > 0 ? 1 : (r < 0 ? -1 : 0));
  return 0;
}
