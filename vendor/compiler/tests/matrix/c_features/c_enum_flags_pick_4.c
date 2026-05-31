/* Enum flags pick F4. */
#include <stdio.h>
enum E_flags { F0, F1, F2, F3, F4, F5, F6, F7 };
int main(void) {
  enum E_flags x = F4;
  printf("%d\n", (int)x);
  return 0;
}
