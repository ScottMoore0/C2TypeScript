/* Preprocessor pattern: nested_ifdef. */
#include <stdio.h>
int main(void) {
#define A
#define B
#ifdef A
#  ifdef B
  printf("both\n");
#  else
  printf("only_a\n");
#  endif
#endif

  return 0;
}
