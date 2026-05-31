/* Macro: isnum. */
#include <stdio.h>
#define ISDIGIT(c) ((c)>='0'&&(c)<='9')
int main(void) {
  printf("%d\n", ISDIGIT('5'));
  return 0;
}
