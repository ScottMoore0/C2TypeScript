/* GCC __builtin_popcount — count set bits. */
#include <stdio.h>
int main(void) {
  printf("%d %d %d %d\n",
    __builtin_popcount(0u),
    __builtin_popcount(0xFu),
    __builtin_popcount(0xAAu),
    __builtin_popcount(0xFFFFu));
  return 0;
}
