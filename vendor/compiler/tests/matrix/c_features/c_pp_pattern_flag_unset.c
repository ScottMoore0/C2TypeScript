/* Preprocessor pattern: flag_unset. */
#include <stdio.h>
int main(void) {
#ifdef NOT_DEFINED
  printf("yes\n");
#else
  printf("no\n");
#endif

  return 0;
}
