/* Hand-rolled strchr for spec correctness. */
#include <stdio.h>
#include <stddef.h>

char *my_strchr(const char *s, int c) {
  while (*s && *s != (char)c) s++;
  return *s == (char)c ? (char *)s : NULL;
}
int main(void) {
  const char *p1 = my_strchr("hello", 'l');
  const char *p2 = my_strchr("hello", 'z');
  printf("%d %d\n", p1 ? (int)(p1 - "hello") : -1, p2 == NULL ? 1 : 0);
  return 0;
}
