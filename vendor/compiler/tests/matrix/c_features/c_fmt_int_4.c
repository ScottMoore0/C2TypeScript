/* Format spec: "%+d" on 12345. */
#include <stdio.h>
int main(void) {
  printf("[%+d]\n", 12345);
  return 0;
}
