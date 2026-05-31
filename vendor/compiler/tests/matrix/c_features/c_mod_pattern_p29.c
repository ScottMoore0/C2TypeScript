/* Modular pattern with prime 29. */
#include <stdio.h>
int main(void) {
  int counts[29] = {0};
  for (int i = 0; i < 100; i++) counts[i % 29]++;
  int total = 0;
  for (int i = 0; i < 29; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
