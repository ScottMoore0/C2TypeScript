/* Format spec: "%05d" on 12345. */
#include <stdio.h>
int main(void) {
  printf("[%05d]\n", 12345);
  return 0;
}
