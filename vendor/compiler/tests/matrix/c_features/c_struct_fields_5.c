/* Struct with 5 fields. */
#include <stdio.h>
struct S5 {
  int f0;
  int f1;
  int f2;
  int f3;
  int f4;
};
int main(void) {
  struct S5 s = { 0, 10, 20, 30, 40 };
  printf("%d %d %d %d %d\n", s.f0, s.f1, s.f2, s.f3, s.f4);
  return 0;
}
