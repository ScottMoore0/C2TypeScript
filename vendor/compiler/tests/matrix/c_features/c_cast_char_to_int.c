/* Cast char → int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  char src = 'A';
  int dst = (int)src;
  printf("%d\n", dst);
  return 0;
}
