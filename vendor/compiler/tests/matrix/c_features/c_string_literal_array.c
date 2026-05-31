/* Array of string literal pointers. */
#include <stdio.h>
const char *months[] = { "jan", "feb", "mar", "apr", "may", "jun" };
int main(void) {
  for (int i = 0; i < 6; i++) printf("%s ", months[i]);
  printf("\n");
  return 0;
}
