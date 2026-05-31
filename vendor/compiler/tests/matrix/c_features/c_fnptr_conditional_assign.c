/* C17 §6.5.15 — conditional expression yielding a function pointer.
 *
 * `fp = cond ? f1 : f2;` and `(cond ? f1 : f2)(args)` patterns
 * appear in dispatch shortcuts. Both arms must be compatible
 * function-pointer types (§6.5.15 p3); the translator must
 * preserve the conditional and the call.
 */
#include <stdio.h>

int positive(int x) { return x; }
int negate(int x) { return -x; }

int main(void) {
  int (*fp)(int) = (5 > 0) ? positive : negate;
  int a = fp(7);
  int b = ((-3 > 0) ? positive : negate)(7);
  printf("a=%d b=%d\n", a, b);
  return 0;
}
