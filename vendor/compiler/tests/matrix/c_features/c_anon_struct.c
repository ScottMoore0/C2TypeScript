/* C17 §6.7.2.1p13: an unnamed struct member acts as an anonymous member.
 * Clang's TypePrinter emits its qualType as
 *   `struct (unnamed struct at <file>:<line>:<col>)`.
 * The type-mapper must normalize that form to a stable identifier so the
 * emitter produces valid TypeScript rather than leaking the raw parenthesised
 * form into function signatures. */
#include <stdio.h>

struct Outer {
    int tag;
    struct {
        int x;
        int y;
    };
};

int main(void) {
    struct Outer o;
    o.tag = 7;
    o.x = 3;
    o.y = 4;
    printf("%d %d %d\n", o.tag, o.x, o.y);
    return 0;
}
