/* Global init: char_z. */
#include <stdio.h>
char g = 'z';
int main(void) {
  printf("%lld\n", (long long)g);
  return 0;
}
