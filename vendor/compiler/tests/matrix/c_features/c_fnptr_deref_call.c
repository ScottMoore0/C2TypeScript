/* C17 §6.5.3.2 + §6.5.2.2 — explicit (*fp)(args) call form.
 *
 * Both `fp(args)` and `(*fp)(args)` are valid per the spec; some
 * codebases (Linux kernel, older libraries) prefer the explicit
 * dereference for readability or to make the indirect call obvious.
 */
#include <stdio.h>

int square(int x) { return x * x; }

int main(void) {
  int (*fp)(int) = &square;     /* explicit address-of */
  int a = fp(5);                /* implicit call */
  int b = (*fp)(6);             /* explicit deref call */
  int c = (**&fp)(7);           /* round-trip & * * */
  printf("a=%d b=%d c=%d\n", a, b, c);
  return 0;
}
