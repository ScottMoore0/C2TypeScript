/* Count uppercase in input 3. */
#include <stdio.h>
int main(void) {
  const char *s = "1234567890";
  int count = 0;
  for (const char *p = s; *p; p++) {
    char c = *p;
    if (c >= 'A' && c <= 'Z') count++;
  }
  printf("%d\n", count);
  return 0;
}
