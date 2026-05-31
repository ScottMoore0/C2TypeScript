/* C17 §6.7.6.3 + §6.7.8 — function-pointer typedef as a function parameter.
 *
 * Equivalent to passing a fnptr directly, but the typedef indirection
 * forced the emitter to inspect the desugared type. Previously, that
 * desugared `void (*)(...)` form contained `*` characters that were
 * mistaken for pointer-to-pointer (`T **`), triggering the ref-arg
 * boxing `{ value: ... }` and breaking the call site `f(L, ud)`.
 * The Lua interpreter's `Pfunc` (typedef for `void (*)(lua_State *,
 * void *)`) used by `luaD_rawrunprotected` is the canonical case.
 */
#include <stdio.h>

typedef int (*Op)(int, int);

int run_op(Op f, int x, int y) {
  return f(x, y);
}

int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

int main(void) {
  printf("add=%d mul=%d\n", run_op(add, 3, 4), run_op(mul, 3, 4));
  return 0;
}
