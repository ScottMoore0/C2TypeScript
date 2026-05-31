/* typedef of function pointer. */
#include <stdio.h>
typedef int (*BinOp)(int, int);
int add(int a, int b) { return a + b; }
int main(void) {
  BinOp op = add;
  printf("%d\n", op(3, 4));
  return 0;
}
