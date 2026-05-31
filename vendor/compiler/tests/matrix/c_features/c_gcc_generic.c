/* C11 _Generic: type-based selection. Used by <tgmath.h>-style polymorphic
 * macros, by safe-conversion macros, and by user code that wants dispatch
 * by concrete argument type.
 */
#include <stdio.h>

#define type_name(x) _Generic((x), \
  int: "int", \
  long: "long", \
  double: "double", \
  char *: "char_ptr", \
  default: "other")

int main(void) {
  int i = 1;
  long l = 2L;
  double d = 3.0;
  char *s = "hi";
  float f = 1.5f;

  printf("i=%s\n", type_name(i));
  printf("l=%s\n", type_name(l));
  printf("d=%s\n", type_name(d));
  printf("s=%s\n", type_name(s));
  printf("f=%s\n", type_name(f));
  return 0;
}
