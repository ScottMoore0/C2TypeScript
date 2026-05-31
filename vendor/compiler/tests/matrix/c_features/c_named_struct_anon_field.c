/* C17 §6.7.2.1: a named struct containing an unnamed nested struct type
 * as a named field (not an anonymous member). Clang's TypePrinter emits
 * the field's qualType as
 *   `struct (unnamed struct at <file>:<line>:<col>)`,
 * which the type-mapper must normalize to a stable identifier so the
 * emitter does not leak the raw parenthesised form into the TS class
 * declaration. This test defines such a struct, then prints a scalar
 * derived from its tag — exercising the anon-type declaration surface
 * without relying on initialization of the nested anon-typed field. */
#include <stdio.h>

struct Outer {
    int tag;
    struct {
        int a;
        int b;
    } point;
};

int main(void) {
    struct Outer o;
    o.tag = 42;
    printf("%d\n", o.tag);
    return 0;
}
