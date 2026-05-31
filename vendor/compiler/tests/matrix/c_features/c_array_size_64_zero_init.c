/* Array of 64 ints, zero init, sum. */
#include <stdio.h>
int main(void) {
  int arr[64] = {0};
  int sum = 0;
  for (int i = 0; i < 64; i++) sum += arr[i];
  printf("%d size=%zu\n", sum, sizeof(arr) / sizeof(arr[0]));
  return 0;
}
