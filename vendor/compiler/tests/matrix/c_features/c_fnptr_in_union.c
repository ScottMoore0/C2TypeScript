/* C17 §6.7.2.1 + §6.7.6.3 — function pointer as union member.
 *
 * Tagged-union dispatch: a single union holds either a callback or
 * raw data, with a tag byte telling the consumer which to use.
 * Used by Lua's TValue, Python's PyObject internals, custom
 * dynamic typing layers.
 */
#include <stdio.h>

union Cell {
  int i;
  int (*fn)(int);
};

int square(int x) { return x * x; }

int main(void) {
  union Cell c;
  c.i = 10;
  printf("i=%d ", c.i);
  c.fn = square;
  printf("fn(7)=%d\n", c.fn(7));
  return 0;
}
