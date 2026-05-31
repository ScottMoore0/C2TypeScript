/* C17 §6.7.9 — designated init in struct's array field. */
#include <stdio.h>
struct S { int xs[5]; int tag; };
int main(void) {
  struct S s = { .xs = { [2] = 99, [4] = 77 }, .tag = 42 };
  for (int i = 0; i < 5; i++) printf("%d ", s.xs[i]);
  printf("/ %d\n", s.tag);
  return 0;
}
