/* C17 §6.3.1.4 — float-to-int truncation. */
#include <stdio.h>
int main(void) {
  printf("%d %d %d %d\n", (int)3.7, (int)3.4, (int)-3.7, (int)-3.4);
  return 0;
}
