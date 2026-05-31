/* Modular pattern with prime 23. */
#include <stdio.h>
int main(void) {
  int counts[23] = {0};
  for (int i = 0; i < 100; i++) counts[i % 23]++;
  int total = 0;
  for (int i = 0; i < 23; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
