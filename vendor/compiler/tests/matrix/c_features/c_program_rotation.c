/* End-to-end program: c_program_rotation. */

#include <stdio.h>
int main(void) {
  int a[] = { 1, 2, 3, 4, 5 };
  int n = 5, k = 2;
  int b[5];
  for (int i = 0; i < n; i++) b[(i + k) % n] = a[i];
  for (int i = 0; i < n; i++) printf("%d ", b[i]);
  printf("\n");
  return 0;
}
