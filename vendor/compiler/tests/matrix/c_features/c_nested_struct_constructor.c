/* C17 §6.7.9 + §6.2.6.1 — nested-struct/union constructor init.
 *
 * `struct Outer o;` (or `o = {0}`) implicitly zero-initialises every
 * scalar AND every nested aggregate field. The translator's class
 * constructor must recursively construct nested struct/union fields
 * so `o.inner.x = 5` doesn't fail with "cannot set property on
 * undefined". This is the universal pattern Lua, SQLite, libpng, and
 * any tagged-union codebase relies on.
 */
#include <stdio.h>

struct Inner { int x; int y; };
struct Outer { int a; struct Inner inner; int b; };

int main(void) {
  struct Outer o = {0};      /* zero-init must construct o.inner */
  o.a = 10;
  o.inner.x = 100;            /* would fail if o.inner is undefined */
  o.inner.y = 200;
  o.b = 30;
  printf("a=%d x=%d y=%d b=%d\n", o.a, o.inner.x, o.inner.y, o.b);
  return 0;
}
