/* Struct with 2 fields. */
#include <stdio.h>
struct S2 {
  int f0;
  int f1;
};
int main(void) {
  struct S2 s = { 0, 10 };
  printf("%d %d\n", s.f0, s.f1);
  return 0;
}
