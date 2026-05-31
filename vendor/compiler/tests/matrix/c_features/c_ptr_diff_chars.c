/* Pointer subtraction on char arrays. */
#include <stdio.h>
int main(void) {
  const char *s = "hello";
  const char *e = s + 5;
  printf("%d\n", (int)(e - s));
  return 0;
}
