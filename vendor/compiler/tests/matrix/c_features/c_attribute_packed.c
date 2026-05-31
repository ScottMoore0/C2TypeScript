/* GCC __attribute__((packed)) — disables alignment padding. */
#include <stdio.h>
struct __attribute__((packed)) Packed {
  char a;
  int b;
  char c;
};
int main(void) {
  struct Packed p = { 'X', 42, 'Y' };
  printf("a=%c b=%d c=%c\n", p.a, p.b, p.c);
  return 0;
}
