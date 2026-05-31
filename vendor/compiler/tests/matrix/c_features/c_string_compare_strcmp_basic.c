/* strcmp ordering. */
#include <stdio.h>
#include <string.h>
int main(void) {
  printf("%d %d %d %d\n",
    strcmp("a", "b") < 0 ? 1 : 0,
    strcmp("b", "a") > 0 ? 1 : 0,
    strcmp("abc", "abc") == 0 ? 1 : 0,
    strcmp("abc", "abcd") < 0 ? 1 : 0);
  return 0;
}
