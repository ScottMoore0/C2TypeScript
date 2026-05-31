/* GCC `__builtin_ia32_pause` — Intel SDM PAUSE; spin-relax CPU hint.
 * Lowered to a no-op JS helper at the call site; surrounding code runs. */
#include <stdio.h>
int main(void) {
  for (int i = 0; i < 4; i++) {
    __builtin_ia32_pause();
  }
  printf("ok\n");
  return 0;
}
