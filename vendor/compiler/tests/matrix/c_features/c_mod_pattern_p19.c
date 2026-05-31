/* Modular pattern with prime 19. */
#include <stdio.h>
int main(void) {
  int counts[19] = {0};
  for (int i = 0; i < 100; i++) counts[i % 19]++;
  int total = 0;
  for (int i = 0; i < 19; i++) total += counts[i];
  printf("%d\n", total);
  return 0;
}
