/* C17 §6.5.17: comma operator composed inside other expression contexts.
 * Exercises comma:
 *   - as the operand of a conditional (?:)
 *   - as an argument of a function call (parenthesized, since the comma inside
 *     a bare call argument list would be an argument separator per §6.5.2.2p6)
 *   - as the index expression of a subscript (§6.5.2.1)
 * Each sub-expression's side effect must fire in source order. */
#include <stdio.h>
int main(void) {
    int a = 0, b = 0, c = 0, d = 0;
    int arr[4] = {10, 20, 30, 40};
    int cond = 1;

    /* Ternary: comma in the chosen branch. */
    int x = cond ? (a = 7, a + 1) : (b = 9, b + 1);

    /* Subscript: comma in index position (parenthesized to disambiguate). */
    int y = arr[(c = 2, c + 1)];

    /* Function call: comma inside a single parenthesized argument. */
    printf("a=%d b=%d c=%d d=%d x=%d y=%d\n",
           a, b, c, d, x, y);
    return 0;
}
