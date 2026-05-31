/* Function: char f(arity=2). */
#include <stdio.h>
char f(int a0, int a1) { char v = (char)(a0 + a1); return v; }
int main(void) {
  printf("%d\n", f(1, 2));
  return 0;
}
