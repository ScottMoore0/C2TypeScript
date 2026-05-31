/* Struct with 6 fields. */
#include <stdio.h>
struct S6 {
  int f0;
  int f1;
  int f2;
  int f3;
  int f4;
  int f5;
};
int main(void) {
  struct S6 s = { 0, 10, 20, 30, 40, 50 };
  printf("%d %d %d %d %d %d\n", s.f0, s.f1, s.f2, s.f3, s.f4, s.f5);
  return 0;
}
