/* strlen basic. */
#include <stdio.h>
#include <string.h>
int main(void) {
  printf("%zu %zu %zu\n", strlen(""), strlen("a"), strlen("hello, world"));
  return 0;
}
