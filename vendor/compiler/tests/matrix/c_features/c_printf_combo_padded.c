/* printf combo: padded. */
#include <stdio.h>
int main(void) {
  printf("[%5d][%-5d][%05d]\n", 42, 42, 42);
  return 0;
}
