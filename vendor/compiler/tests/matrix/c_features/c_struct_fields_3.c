/* Struct with 3 fields. */
#include <stdio.h>
struct S3 {
  int f0;
  int f1;
  int f2;
};
int main(void) {
  struct S3 s = { 0, 10, 20 };
  printf("%d %d %d\n", s.f0, s.f1, s.f2);
  return 0;
}
