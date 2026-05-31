/* C17 §6.7.6.3 — function returning a function pointer.
 *
 * Used by interpreter dispatch ("get_handler(opcode)"), strategy
 * pickers, plugin selectors. The complex declarator syntax
 * `int (*get(int))(int, int)` is also a translator stress test —
 * the AST distinguishes between "function returning fnptr" and
 * "fnptr to function returning int".
 */
#include <stdio.h>

int compute_add(int a, int b) { return a + b; }
int compute_mul(int a, int b) { return a * b; }

int (*select_op(int kind))(int, int) {
  if (kind == 0) return compute_add;
  return compute_mul;
}

int main(void) {
  int (*op)(int, int) = select_op(0);
  printf("add=%d ", op(3, 4));
  op = select_op(1);
  printf("mul=%d\n", op(3, 4));
  return 0;
}
