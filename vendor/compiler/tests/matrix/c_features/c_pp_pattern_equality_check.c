/* Preprocessor pattern: equality_check. */
#include <stdio.h>
int main(void) {
#define MODE 5
#if MODE == 5
  printf("five\n");
#elif MODE == 3
  printf("three\n");
#else
  printf("other\n");
#endif

  return 0;
}
