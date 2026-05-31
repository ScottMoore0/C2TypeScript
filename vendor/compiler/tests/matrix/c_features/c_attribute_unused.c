/* GCC __attribute__((unused)) — suppress unused-variable warning. */
#include <stdio.h>
int main(void) {
  int __attribute__((unused)) tmp = 42;
  printf("ok\n");
  return 0;
}
