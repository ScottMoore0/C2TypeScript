/* Classic macro min/max (with double-eval pitfall). */
#include <stdio.h>
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define MAX(a, b) ((a) > (b) ? (a) : (b))
int main(void) {
  printf("%d %d %d %d\n",
    MIN(3, 5), MAX(3, 5), MIN(-1, -2), MAX(-1, -2));
  return 0;
}
