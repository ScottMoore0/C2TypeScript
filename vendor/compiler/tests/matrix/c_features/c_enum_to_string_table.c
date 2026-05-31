/* Enum-to-string mapping via const char* table. */
#include <stdio.h>
enum Color { RED, GREEN, BLUE, COLOR_COUNT };
const char *names[COLOR_COUNT] = { "red", "green", "blue" };
int main(void) {
  for (int i = 0; i < COLOR_COUNT; i++) printf("%s ", names[i]);
  printf("\n");
  return 0;
}
