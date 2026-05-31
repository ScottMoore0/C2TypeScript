/* C17 §6.7.9 — partial array init zero-fills the rest. */
#include <stdio.h>
int main(void) {
  int arr[8] = { 1, 2, 3 };
  for (int i = 0; i < 8; i++) printf("%d ", arr[i]);
  printf("\n");
  return 0;
}
