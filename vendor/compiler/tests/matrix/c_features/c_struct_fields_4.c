/* Struct with 4 fields. */
#include <stdio.h>
struct S4 {
  int f0;
  int f1;
  int f2;
  int f3;
};
int main(void) {
  struct S4 s = { 0, 10, 20, 30 };
  printf("%d %d %d %d\n", s.f0, s.f1, s.f2, s.f3);
  return 0;
}
