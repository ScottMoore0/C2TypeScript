/* Macro defining N=2 for use in array size. */
#include <stdio.h>
#define N 2
int main(void) {
  int a[N];
  for (int i = 0; i < N; i++) a[i] = i;
  int s = 0;
  for (int i = 0; i < N; i++) s += a[i];
  printf("%d %d\n", s, N);
  return 0;
}
