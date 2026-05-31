/* Typedef size_t_alias. */
#include <stdio.h>
typedef unsigned long usize;
int main(void) {
  printf("%lu\n", (usize)1000UL);
  return 0;
}
