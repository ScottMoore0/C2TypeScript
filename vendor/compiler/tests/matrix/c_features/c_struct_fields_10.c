/* Struct with 10 fields. */
#include <stdio.h>
struct S10 {
  int f0;
  int f1;
  int f2;
  int f3;
  int f4;
  int f5;
  int f6;
  int f7;
  int f8;
  int f9;
};
int main(void) {
  struct S10 s = { 0, 10, 20, 30, 40, 50, 60, 70, 80, 90 };
  printf("%d %d %d %d %d %d %d %d %d %d\n", s.f0, s.f1, s.f2, s.f3, s.f4, s.f5, s.f6, s.f7, s.f8, s.f9);
  return 0;
}
