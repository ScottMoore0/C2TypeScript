/* Algorithm: dict_key_lookup. */
#include <stdio.h>
int main(void) {
  const char *keys[] = { "alpha", "beta", "gamma", "delta" };
  int values[] = { 1, 2, 3, 4 };
  const char *q = "gamma";
  int found = -1;
  for (int i = 0; i < 4; i++) {
    int eq = 1;
    const char *a = keys[i], *b = q;
    while (*a && *a == *b) { a++; b++; }
    if (*a == *b) { found = values[i]; break; }
  }
  printf("%d\n", found);
  return 0;
}
