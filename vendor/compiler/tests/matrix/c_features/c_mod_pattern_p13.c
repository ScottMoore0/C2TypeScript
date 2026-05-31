/* Modular pattern with prime 13. */
#include <stdio.h>
int main(void) {
  int counts[13] = {0};
  for (int i = 0; i < 100; i++) counts[i % 13]++;
  int total = 0;
  for (int i = 0; i < 13; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
