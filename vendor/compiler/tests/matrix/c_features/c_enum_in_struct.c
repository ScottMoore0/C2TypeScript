/* Enum field inside struct. */
#include <stdio.h>
enum Color { RED, GREEN, BLUE };
struct Item { enum Color c; int qty; };
int main(void) {
  struct Item it = { GREEN, 7 };
  printf("%d %d\n", it.c, it.qty);
  return 0;
}
