/* Preprocessor pattern: flag_set. */
#include <stdio.h>
int main(void) {
#define FLAG
#ifdef FLAG
  printf("yes\n");
#else
  printf("no\n");
#endif

  return 0;
}
