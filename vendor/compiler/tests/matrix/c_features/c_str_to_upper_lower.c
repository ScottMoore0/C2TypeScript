/* Convert string to upper/lower. */
#include <stdio.h>
#include <ctype.h>
int main(void) {
  char s[] = "Hello, World!";
  char up[64], lo[64];
  int i;
  for (i = 0; s[i]; i++) up[i] = (char)toupper((unsigned char)s[i]);
  up[i] = 0;
  for (i = 0; s[i]; i++) lo[i] = (char)tolower((unsigned char)s[i]);
  lo[i] = 0;
  printf("%s\n%s\n", up, lo);
  return 0;
}
