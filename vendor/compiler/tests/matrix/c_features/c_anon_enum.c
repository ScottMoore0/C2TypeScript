/* C17 §6.7.2.2: a struct containing a named field whose type is an
 * anonymous (tagless) enum. Clang's TypePrinter emits the field's
 * qualType as `enum (unnamed enum at <file>:<line>:<col>)`. The
 * type-mapper must normalize that form to a stable identifier so the
 * emitter produces valid TypeScript rather than leaking the raw
 * parenthesised form.  We reference the enum constant by its integer
 * value at the assignment site to avoid depending on separate emitter
 * support for injecting anonymous-enum constants into outer scope. */
#include <stdio.h>

struct Outer {
    int tag;
    enum { RED = 1, GREEN = 2, BLUE = 3 } colour;
};

int main(void) {
    struct Outer o;
    o.tag = 0;
    o.colour = (int)2;   /* value of GREEN */
    printf("%d %d\n", o.tag, (int)o.colour);
    return 0;
}
