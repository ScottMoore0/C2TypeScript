/* Count occurrences of each char (small alphabet). */
#include <stdio.h>
int main(void) {
  const char *s = "abracadabra";
  int counts[26] = {0};
  for (const char *p = s; *p; p++) {
    if (*p >= 'a' && *p <= 'z') counts[*p - 'a']++;
  }
  for (int c = 0; c < 26; c++)
    if (counts[c]) printf("%c=%d ", 'a' + c, counts[c]);
  printf("\n");
  return 0;
}
