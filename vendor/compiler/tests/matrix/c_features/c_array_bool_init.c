/* Bool array init. */
#include <stdio.h>
#include <stdbool.h>
int main(void) {
  bool flags[5] = { true, false, true, true, false };
  int set = 0;
  for (int i = 0; i < 5; i++) if (flags[i]) set++;
  printf("%d\n", set);
  return 0;
}
