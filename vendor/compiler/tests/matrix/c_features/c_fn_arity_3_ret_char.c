/* Function: char f(arity=3). */
#include <stdio.h>
char f(int a0, int a1, int a2) { char v = (char)(a0 + a1 + a2); return v; }
int main(void) {
  printf("%d\n", f(1, 2, 3));
  return 0;
}
