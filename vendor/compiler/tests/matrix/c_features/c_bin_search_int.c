/* Binary search in sorted int array. */
#include <stdio.h>
int bsearch_int(const int *a, int n, int key) {
  int lo = 0, hi = n - 1;
  while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == key) return mid;
    if (a[mid] < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
int main(void) {
  int data[] = { 1, 3, 5, 7, 9, 11, 13, 15, 17 };
  printf("%d %d %d %d\n",
    bsearch_int(data, 9, 5),
    bsearch_int(data, 9, 17),
    bsearch_int(data, 9, 1),
    bsearch_int(data, 9, 4));
  return 0;
}
