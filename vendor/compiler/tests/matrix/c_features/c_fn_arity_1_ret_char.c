/* Function: char f(arity=1). */
#include <stdio.h>
char f(int a0) { char v = (char)(a0); return v; }
int main(void) {
  printf("%d\n", f(1));
  return 0;
}
