/* strlen on input 0: "hello". */
#include <stdio.h>
#include <string.h>
int main(void) {
  printf("%zu\n", strlen("hello"));
  return 0;
}
