/* Recursive-looking macro (preprocessor only expands once). */
#include <stdio.h>
#define X 1
#define Y X + 1
#define Z Y + 1
int main(void) {
  printf("%d %d %d\n", X, Y, Z);
  return 0;
}
