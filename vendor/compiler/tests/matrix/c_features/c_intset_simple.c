/* Simple int set via sorted array. */
#include <stdio.h>
int main(void) {
  int a[100] = {0};
  int n = 0;
  int input[] = { 5, 3, 1, 5, 2, 3, 9, 1 };
  for (int i = 0; i < 8; i++) {
    int x = input[i];
    int found = 0;
    for (int j = 0; j < n; j++) if (a[j] == x) { found = 1; break; }
    if (!found) a[n++] = x;
  }
  for (int i = 0; i < n; i++) printf("%d ", a[i]);
  printf("\n");
  return 0;
}
