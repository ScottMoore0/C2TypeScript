/* Macro for static array length. */
#include <stdio.h>
#define ARRAY_LEN(a) (sizeof(a) / sizeof((a)[0]))
int main(void) {
  int xs[8];
  char ys[] = "hello";
  printf("%zu %zu\n", ARRAY_LEN(xs), ARRAY_LEN(ys));
  return 0;
}
