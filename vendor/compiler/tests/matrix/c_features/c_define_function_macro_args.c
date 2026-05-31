/* Function-like macro with multiple args. */
#include <stdio.h>
#define CLAMP(v, lo, hi) ((v) < (lo) ? (lo) : ((v) > (hi) ? (hi) : (v)))
int main(void) {
  printf("%d %d %d\n", CLAMP(5, 0, 10), CLAMP(-3, 0, 10), CLAMP(15, 0, 10));
  return 0;
}
