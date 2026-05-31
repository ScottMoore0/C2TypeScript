/* C17 §6.7.6.2 + §6.7.6.3 — array of function pointers as jump table.
 *
 * Canonical pattern for opcode dispatch (interpreters), state machines,
 * command parsers. The translator must:
 *   - emit the array literal with function designators decaying to
 *     function pointers (§6.3.2.1)
 *   - resolve `table[i]` as a function-pointer value
 *   - call the resolved value with the call-site argument list
 */
#include <stdio.h>

int op_add(int x, int y) { return x + y; }
int op_sub(int x, int y) { return x - y; }
int op_mul(int x, int y) { return x * y; }

int main(void) {
  int (*ops[3])(int, int) = { op_add, op_sub, op_mul };
  for (int i = 0; i < 3; i++) {
    printf("%d ", ops[i](6, 2));
  }
  printf("\n");
  return 0;
}
