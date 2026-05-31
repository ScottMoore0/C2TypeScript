/* Word count via state machine. */
#include <stdio.h>
#include <ctype.h>
int word_count(const char *s) {
  int count = 0, in_word = 0;
  while (*s) {
    if (isspace((unsigned char)*s)) in_word = 0;
    else if (!in_word) { in_word = 1; count++; }
    s++;
  }
  return count;
}
int main(void) {
  printf("%d %d %d\n",
    word_count("hello world"),
    word_count("  multiple   spaces   between  "),
    word_count(""));
  return 0;
}
