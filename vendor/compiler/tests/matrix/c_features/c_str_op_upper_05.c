/* String op upper on input 5. */
#include <stdio.h>
int main(void) {
  char buf[128] = "trailing  spaces  ";
  for (int i = 0; buf[i]; i++) if (buf[i] >= 'a' && buf[i] <= 'z') buf[i] -= 32;
  printf("|%s|\n", buf);
  return 0;
}
