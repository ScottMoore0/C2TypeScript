/* strncmp with len shorter than first diff. */
#include <stdio.h>
#include <string.h>
int main(void) {
  printf("%d\n", strncmp("apple", "appearance", 3) == 0 ? 1 : 0);
  return 0;
}
