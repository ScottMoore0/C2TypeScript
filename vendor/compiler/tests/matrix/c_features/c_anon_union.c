/* C17 §6.7.2.1p13: an unnamed union member acts as an anonymous member and
 * its members are accessed directly through the enclosing struct. Clang
 * emits the qualType as `union (unnamed union at <file>:<line>:<col>)`;
 * the type-mapper must normalize that form. */
#include <stdio.h>

struct Outer {
    int tag;
    union {
        int i;
        float f;
    };
};

int main(void) {
    struct Outer o;
    o.tag = 1;
    o.i = 42;
    printf("%d %d\n", o.tag, o.i);
    return 0;
}
