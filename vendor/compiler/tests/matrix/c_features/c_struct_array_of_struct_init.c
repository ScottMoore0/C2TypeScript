/* C17 §6.7.9 — array of struct init. */
#include <stdio.h>
struct Item { int code; double value; };
int main(void) {
  struct Item items[3] = {
    { 1, 1.5 },
    { 2, 2.5 },
    { 3, 3.5 },
  };
  for (int i = 0; i < 3; i++)
    printf("%d:%.1f ", items[i].code, items[i].value);
  printf("\n");
  return 0;
}
