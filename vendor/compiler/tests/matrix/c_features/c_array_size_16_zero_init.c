/* Array of 16 ints, zero init, sum. */
#include <stdio.h>
int main(void) {
  int arr[16] = {0};
  int sum = 0;
  for (int i = 0; i < 16; i++) sum += arr[i];
  printf("%d size=%zu\n", sum, sizeof(arr) / sizeof(arr[0]));
  return 0;
}
