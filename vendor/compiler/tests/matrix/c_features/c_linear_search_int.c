/* Linear search. */
#include <stdio.h>
int find(const int *a, int n, int k) {
  for (int i = 0; i < n; i++) if (a[i] == k) return i;
  return -1;
}
int main(void) {
  int data[] = { 7, 3, 9, 1, 5 };
  printf("%d %d %d\n", find(data, 5, 1), find(data, 5, 9), find(data, 5, 100));
  return 0;
}
