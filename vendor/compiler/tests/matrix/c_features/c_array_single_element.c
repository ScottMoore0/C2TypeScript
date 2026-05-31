/* Single-element array. */
#include <stdio.h>
int main(void) {
  int arr[1] = { 42 };
  printf("%d %zu\n", arr[0], sizeof(arr) / sizeof(arr[0]));
  return 0;
}
