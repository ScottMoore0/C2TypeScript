/* Macro: clamp. */
#include <stdio.h>
#define CLAMP(v,lo,hi) ((v)<(lo)?(lo):((v)>(hi)?(hi):(v)))
int main(void) {
  printf("%d\n", CLAMP(15, 0, 10));
  return 0;
}
