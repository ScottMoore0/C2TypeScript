/* End-to-end program: c_program_reverse_str. */

#include <stdio.h>
#include <string.h>
int main(void) {
  char buf[] = "hello";
  int n = strlen(buf);
  for (int i = 0; i < n/2; i++) {
    char t = buf[i]; buf[i] = buf[n-1-i]; buf[n-1-i] = t;
  }
  printf("%s\n", buf);
  return 0;
}
