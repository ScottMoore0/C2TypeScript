/* C17 §6.5.17: comma operator in a variable initializer.
 * "The left operand ... is evaluated as a void expression; there is a sequence
 *  point between its evaluation and that of the right operand. Then the right
 *  operand is evaluated; the result has its type and value."
 * All three sub-expressions execute (side effects on a and b are visible) and
 * the final value (c) is bound to x. */
#include <stdio.h>
int main(void) {
    int a = 1, b = 2, c = 10;
    int x = (a++, b++, c);
    printf("a=%d b=%d c=%d x=%d\n", a, b, c, x);
    return 0;
}
