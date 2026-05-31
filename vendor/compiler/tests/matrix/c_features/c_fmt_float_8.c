/* Format spec: "%010.2f" on 3.14159. */
#include <stdio.h>
int main(void) {
  printf("[%010.2f]\n", 3.14159);
  return 0;
}
