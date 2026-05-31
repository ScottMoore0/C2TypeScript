/* Computed goto — interpreter dispatch. CPython, Lua, MicroPython,
 * BPF VMs all use this idiom. The dispatch table is at file scope or
 * static-initialized at function entry.
 */
#include <stdio.h>

int dispatch(int op, int a, int b) {
  static const void *labels[] = { &&op_add, &&op_sub, &&op_mul, &&op_done };
  int result = 0;
  goto *labels[op];

op_add:
  result = a + b;
  goto *labels[3];
op_sub:
  result = a - b;
  goto *labels[3];
op_mul:
  result = a * b;
  goto *labels[3];
op_done:
  return result;
}

int main(void) {
  printf("add=%d\n", dispatch(0, 3, 4));
  printf("sub=%d\n", dispatch(1, 10, 3));
  printf("mul=%d\n", dispatch(2, 6, 7));
  return 0;
}
