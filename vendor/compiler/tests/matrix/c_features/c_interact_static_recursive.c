/* Interaction: static_recursive. */
#include <stdio.h>

int rec(int n) { static int depth = 0; depth++; if (n <= 0) return depth; int r = rec(n-1); depth--; return r; }
int main(void) {
  printf("%d %d\n", rec(5), rec(3));
  return 0;
}

