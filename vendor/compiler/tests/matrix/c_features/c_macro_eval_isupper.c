/* Macro: isupper. */
#include <stdio.h>
#define ISUP(c) ((c)>='A'&&(c)<='Z')
int main(void) {
  printf("%d\n", ISUP('K'));
  return 0;
}
