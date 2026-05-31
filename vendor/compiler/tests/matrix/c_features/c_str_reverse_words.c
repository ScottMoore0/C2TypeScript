/* Word-level reverse: split + reassemble. */
#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[64] = "hello world how are you";
  char *parts[16];
  int n = 0;
  for (char *t = strtok(buf, " "); t && n < 16; t = strtok(NULL, " ")) parts[n++] = t;
  for (int i = n - 1; i >= 0; i--) printf("%s%s", parts[i], i > 0 ? " " : "\n");
  return 0;
}
