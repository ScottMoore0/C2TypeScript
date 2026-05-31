/* Function: char f(arity=4). */
#include <stdio.h>
char f(int a0, int a1, int a2, int a3) { char v = (char)(a0 + a1 + a2 + a3); return v; }
int main(void) {
  printf("%d\n", f(1, 2, 3, 4));
  return 0;
}
