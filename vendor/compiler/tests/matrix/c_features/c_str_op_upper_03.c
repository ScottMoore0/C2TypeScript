/* String op upper on input 3. */
#include <stdio.h>
int main(void) {
  char buf[128] = "Sphinx of Black Quartz";
  for (int i = 0; buf[i]; i++) if (buf[i] >= 'a' && buf[i] <= 'z') buf[i] -= 32;
  printf("|%s|\n", buf);
  return 0;
}
