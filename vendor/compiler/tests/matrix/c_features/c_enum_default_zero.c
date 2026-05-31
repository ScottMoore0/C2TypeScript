/* Enum without explicit values starts at 0. */
#include <stdio.h>
enum E { A, B, C, D, E_LAST };
int main(void) {
  printf("%d %d %d %d %d\n", A, B, C, D, E_LAST);
  return 0;
}
