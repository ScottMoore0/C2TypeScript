/* C11 §6.7.5 — _Alignas. */
#include <stdio.h>
#include <stdalign.h>
int main(void) {
  alignas(16) char buf[16];
  for (int i = 0; i < 16; i++) buf[i] = i;
  int sum = 0;
  for (int i = 0; i < 16; i++) sum += buf[i];
  printf("%d\n", sum);
  return 0;
}
