/* Use memset to zero an int array. */
#include <stdio.h>
#include <string.h>
int main(void) {
  int arr[8];
  memset(arr, 0, sizeof(arr));
  int sum = 0;
  for (int i = 0; i < 8; i++) sum += arr[i];
  printf("%d\n", sum);
  return 0;
}
