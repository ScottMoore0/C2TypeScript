/* switch pattern: multi_default_first. */
#include <stdio.h>
int f(int x) {
  switch (x) {
    default: return 99;
    case 5: return 5;
  }
}
int main(void) {
  for (int i = 0; i < 8; i++) printf("%d ", f(i));
  printf("\n");
  return 0;
}
