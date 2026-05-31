/* Format spec: "%5x" on 12345. */
#include <stdio.h>
int main(void) {
  printf("[%5x]\n", 12345);
  return 0;
}
