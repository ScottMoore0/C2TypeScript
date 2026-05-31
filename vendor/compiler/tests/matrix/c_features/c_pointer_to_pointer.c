/* Pointer-to-pointer (T**). */
#include <stdio.h>
void replace(int **pp, int *new_) { *pp = new_; }
int main(void) {
  int a = 1, b = 2;
  int *p = &a;
  printf("%d\n", *p);
  replace(&p, &b);
  printf("%d\n", *p);
  return 0;
}
