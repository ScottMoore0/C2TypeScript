/* GCC __builtin_expect — branch-prediction hint, returns first arg. */
#include <stdio.h>
int main(void) {
  int x = 5;
  if (__builtin_expect(x == 5, 1)) printf("hot\n");
  if (__builtin_expect(x == 99, 0)) printf("never\n");
  return 0;
}
