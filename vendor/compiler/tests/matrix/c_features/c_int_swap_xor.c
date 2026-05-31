/* XOR-swap pattern. */
#include <stdio.h>
int main(void) {
  int a = 17, b = 23;
  a ^= b; b ^= a; a ^= b;
  printf("%d %d\n", a, b);
  return 0;
}
