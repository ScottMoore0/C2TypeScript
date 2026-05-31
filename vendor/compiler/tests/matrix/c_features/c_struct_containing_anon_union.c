/* C17 §6.7.2.1: a struct that contains an anonymous union member is itself
 * a struct, not a union. Its fields have distinct offsets.
 *
 * This is Lua's `Vardesc` shape:
 *   typedef struct Vardesc {
 *     union { ... } vd;
 *     TValue k;
 *   } Vardesc;
 *
 * EXPECT prints: outer.b=99 (b is at offset sizeof(union), NOT 0).
 */
#include <stdio.h>

typedef struct {
  union {
    int  x;
    long y;
  } u;
  int b;
} Outer;

int main(void) {
  Outer o;
  o.u.x = 0;
  o.b = 99;
  /* If the translator misclassifies Outer as a union, b would alias to
   * u.x at offset 0 and read as 0 instead of 99. */
  printf("outer.b=%d\n", o.b);
  return 0;
}
