/* Pointer pattern: two_pointer_window. */
#include <stdio.h>
int main(void) {
  int arr[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
  int *l = arr, *r = arr + 7;
  int s = 0;
  while (l < r) { s += *l + *r; l++; r--; }
  if (l == r) s += *l;
  printf("%d\n", s);
  return 0;
}
