/* C17 §6.7.6.3 — callback + context (`void *user_data`) pair.
 *
 * The universal callback API shape: `register(fn, ctx)` and the
 * library calls `fn(args, ctx)`. Used by libuv, GLib, Tcl, Lua's
 * lua_pushcfunction-with-upvalues equivalent. The translator must
 * faithfully thread the `void *` context through the indirection
 * without losing identity.
 */
#include <stdio.h>

typedef int (*reducer_t)(int acc, int x, void *ctx);

int sum_with_bias(int acc, int x, void *ctx) {
  int bias = *(int *)ctx;
  return acc + x + bias;
}

int run(reducer_t fn, void *ctx, int *arr, int n) {
  int acc = 0;
  for (int i = 0; i < n; i++) acc = fn(acc, arr[i], ctx);
  return acc;
}

int main(void) {
  int arr[4] = { 1, 2, 3, 4 };
  int bias = 10;
  int total = run(sum_with_bias, &bias, arr, 4);
  printf("total=%d\n", total); /* 0+1+10+2+10+3+10+4+10 = 50 */
  return 0;
}
