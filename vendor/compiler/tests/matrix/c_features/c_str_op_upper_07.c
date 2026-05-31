/* String op upper on input 7. */
#include <stdio.h>
int main(void) {
  char buf[128] = "no_spaces_here";
  for (int i = 0; buf[i]; i++) if (buf[i] >= 'a' && buf[i] <= 'z') buf[i] -= 32;
  printf("|%s|\n", buf);
  return 0;
}
