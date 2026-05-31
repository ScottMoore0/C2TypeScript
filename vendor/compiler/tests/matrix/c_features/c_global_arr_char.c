/* Global array of char. */
#include <stdio.h>
char g[] = "hello";
int main(void) {
  for (int i = 0; i < 6; i++) printf("%c ", g[i]);
  printf("\n");
  return 0;
}
