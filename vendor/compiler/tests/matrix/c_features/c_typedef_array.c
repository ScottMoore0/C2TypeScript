/* typedef of array type. */
#include <stdio.h>
typedef int Vec3[3];
int main(void) {
  Vec3 v = { 10, 20, 30 };
  printf("%d %d %d\n", v[0], v[1], v[2]);
  return 0;
}
