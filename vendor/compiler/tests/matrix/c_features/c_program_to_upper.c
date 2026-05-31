/* End-to-end program: c_program_to_upper. */

#include <stdio.h>
#include <ctype.h>
int main(void) {
  char buf[] = "Hello World";
  for (int i = 0; buf[i]; i++) buf[i] = toupper((unsigned char)buf[i]);
  printf("%s\n", buf);
  return 0;
}
