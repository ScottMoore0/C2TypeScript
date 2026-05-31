/* C17 §6.3.1.1 — integer promotion of char/short to int. */
#include <stdio.h>
int main(void) {
  char a = 100;
  char b = 100;
  int s = a + b;     /* promoted to int, sum 200 (no overflow as char) */
  printf("%d\n", s);
  return 0;
}
