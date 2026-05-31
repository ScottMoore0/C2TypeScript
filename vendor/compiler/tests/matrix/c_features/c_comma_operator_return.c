/* C17 §6.5.17: comma operator inside a return expression.
 * The left operand's side effect (printf) must occur, and the right operand
 *  (the literal 42) is the returned value. */
#include <stdio.h>
static int f(void) {
    return (printf("hi\n"), 42);
}
int main(void) {
    int r = f();
    printf("r=%d\n", r);
    return 0;
}
