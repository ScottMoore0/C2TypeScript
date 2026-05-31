/* Modular pattern with prime 7. */
#include <stdio.h>
int main(void) {
  int counts[7] = {0};
  for (int i = 0; i < 100; i++) counts[i % 7]++;
  int total = 0;
  for (int i = 0; i < 7; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
