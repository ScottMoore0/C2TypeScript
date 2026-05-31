/* GCC __attribute__((noreturn)) on functions that don't return. */
#include <stdio.h>
#include <stdlib.h>
__attribute__((noreturn)) void die(const char *msg) {
  printf("die: %s\n", msg);
  exit(0);
}
int main(void) {
  die("ok");
  /* unreachable */
  return 0;
}
