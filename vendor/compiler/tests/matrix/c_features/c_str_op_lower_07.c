/* String op lower on input 7. */
#include <stdio.h>
int main(void) {
  char buf[128] = "no_spaces_here";
  for (int i = 0; buf[i]; i++) if (buf[i] >= 'A' && buf[i] <= 'Z') buf[i] += 32;
  printf("|%s|\n", buf);
  return 0;
}
