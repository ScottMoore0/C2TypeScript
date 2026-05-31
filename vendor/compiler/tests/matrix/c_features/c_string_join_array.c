/* Join array of strings with delim. */
#include <stdio.h>
#include <string.h>
int main(void) {
  const char *parts[] = { "alpha", "beta", "gamma", "delta" };
  char buf[64] = "";
  for (int i = 0; i < 4; i++) {
    if (i > 0) strcat(buf, ", ");
    strcat(buf, parts[i]);
  }
  printf("%s\n", buf);
  return 0;
}
