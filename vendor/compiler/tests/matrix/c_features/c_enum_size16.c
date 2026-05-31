/* Enum with 16 values. */
#include <stdio.h>
enum E_16 { E_A, E_B, E_C, E_D, E_E, E_F, E_G, E_H, E_I, E_J, E_K, E_L, E_M, E_N, E_O, E_P };
int main(void) {
  printf("%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d\n", E_A, E_B, E_C, E_D, E_E, E_F, E_G, E_H, E_I, E_J, E_K, E_L, E_M, E_N, E_O, E_P);
  return 0;
}
