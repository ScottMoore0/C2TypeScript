/* Run-length encoding for char. */
#include <stdio.h>
int main(void) {
  const char *s = "aaabbcaaaa";
  char out[64];
  int j = 0;
  for (int i = 0; s[i]; ) {
    int run = 1;
    while (s[i + run] == s[i]) run++;
    out[j++] = s[i];
    out[j++] = '0' + run;
    i += run;
  }
  out[j] = 0;
  printf("%s\n", out);
  return 0;
}
