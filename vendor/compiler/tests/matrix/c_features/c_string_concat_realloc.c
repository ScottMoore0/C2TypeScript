/* String build via realloc. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(void) {
  char *buf = malloc(1);
  buf[0] = '\0';
  size_t total = 1;
  const char *parts[] = { "hello", ", ", "world", "!" };
  for (int i = 0; i < 4; i++) {
    size_t plen = strlen(parts[i]);
    buf = realloc(buf, total + plen);
    strcat(buf, parts[i]);
    total += plen;
  }
  printf("%s\n", buf);
  free(buf);
  return 0;
}
