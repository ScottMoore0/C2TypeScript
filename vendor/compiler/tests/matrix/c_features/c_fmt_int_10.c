/* Format spec: "%05x" on 12345. */
#include <stdio.h>
int main(void) {
  printf("[%05x]\n", 12345);
  return 0;
}
