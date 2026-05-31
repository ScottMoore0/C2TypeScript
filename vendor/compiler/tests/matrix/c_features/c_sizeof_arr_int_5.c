/* sizeof: arr_int_5. */
#include <stdio.h>
int main(void) {
  printf("%zu\n", (size_t)sizeof(int[5]));
  return 0;
}
