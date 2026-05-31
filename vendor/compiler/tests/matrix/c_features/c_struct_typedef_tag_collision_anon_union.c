/* C17 §6.7.8: typedef name and struct tag can be the same identifier.
 *
 * Lua's `typedef struct Vardesc { union { ... } vd; TValue k; } Vardesc;`
 * shape. Differs from c_struct_containing_anon_union by adding the explicit
 * `Vardesc` tag (typedef name == tag name).
 *
 * EXPECT: 42.
 */
#include <stdio.h>

typedef struct Outer {
  union {
    int  x;
    long y;
  } u;
  int b;
} Outer;

int main(void) {
  Outer o;
  o.u.x = 0;
  o.b = 42;
  printf("b=%d\n", o.b);
  return 0;
}
