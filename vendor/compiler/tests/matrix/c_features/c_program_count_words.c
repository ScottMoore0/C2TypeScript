/* End-to-end program: c_program_count_words. */

#include <stdio.h>
#include <ctype.h>
int main(void) {
  const char *s = "the quick brown fox jumps over";
  int wc = 0, in_w = 0;
  for (const char *p = s; *p; p++) {
    if (isspace((unsigned char)*p)) in_w = 0;
    else if (!in_w) { in_w = 1; wc++; }
  }
  printf("%d\n", wc);
  return 0;
}
