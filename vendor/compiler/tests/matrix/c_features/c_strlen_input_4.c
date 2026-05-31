/* strlen on input 4: "abc def ghi". */
#include <stdio.h>
#include <string.h>
int main(void) {
  printf("%zu\n", strlen("abc def ghi"));
  return 0;
}
