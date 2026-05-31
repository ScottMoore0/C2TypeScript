/* Hand-rolled toupper for spec correctness. */
#include <stdio.h>
#include <stddef.h>

int my_toupper(int c) { return (c >= 'a' && c <= 'z') ? c - 32 : c; }
int main(void) {
  printf("%c %c %c\n", my_toupper('a'), my_toupper('A'), my_toupper('5'));
  return 0;
}
