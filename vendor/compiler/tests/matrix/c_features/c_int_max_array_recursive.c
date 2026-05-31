/* Recursive max of array. */
#include <stdio.h>
int rmax(int *a, int n) {
  if (n == 1) return a[0];
  int rest = rmax(a + 1, n - 1);
  return a[0] > rest ? a[0] : rest;
}
int main(void) {
  int data[] = { 4, 9, 1, 7, 5, 2 };
  printf("%d\n", rmax(data, 6));
  return 0;
}
