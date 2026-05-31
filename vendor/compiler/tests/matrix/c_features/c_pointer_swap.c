/* Classic pointer swap function. */
#include <stdio.h>
void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }
int main(void) {
  int x = 7, y = 11;
  swap(&x, &y);
  printf("%d %d\n", x, y);
  return 0;
}
