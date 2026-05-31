/* Modular pattern with prime 31. */
#include <stdio.h>
int main(void) {
  int counts[31] = {0};
  for (int i = 0; i < 100; i++) counts[i % 31]++;
  int total = 0;
  for (int i = 0; i < 31; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
