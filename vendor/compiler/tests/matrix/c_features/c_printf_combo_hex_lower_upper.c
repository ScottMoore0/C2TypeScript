/* printf combo: hex_lower_upper. */
#include <stdio.h>
int main(void) {
  printf("%x-%X\n", 0xABCD, 0xABCD);
  return 0;
}
