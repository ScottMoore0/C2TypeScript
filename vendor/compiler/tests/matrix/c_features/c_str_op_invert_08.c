/* String op invert on input 8. */
#include <stdio.h>
int main(void) {
  char buf[128] = "very long string for testing edge cases here";
  for (int i = 0; buf[i]; i++) if (buf[i] >= 'a' && buf[i] <= 'z') buf[i] -= 32; else if (buf[i] >= 'A' && buf[i] <= 'Z') buf[i] += 32;
  printf("|%s|\n", buf);
  return 0;
}
