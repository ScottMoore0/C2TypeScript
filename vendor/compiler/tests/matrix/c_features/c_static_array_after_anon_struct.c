/* C17 §6.7.9p14-p16: an InitListExpr for an array type must be treated as
 * an array initializer even when a prior anonymous struct has been declared
 * in the same TU. Regression test: before fix, the emitter's
 * lastAnonymousRecordKey fallback caused `static const u16 aMx[] = {...}` to
 * emit `Object.assign(new const_u16[](), { x:..., y:... })`.
 * Mirrors the SQLite amalgamation pattern. */
#include <stdio.h>

/* Trigger lastAnonymousRecordKey by declaring an anonymous typedef'd struct. */
typedef struct { int x; int y; } Pair;
static Pair p = { 7, 9 };

/* Now a static const array of an aliased integer type. */
typedef unsigned short u16;
static const u16 aMx[] = { 12, 14, 24, 31, 59, 14712 };

int main(void) {
    int v = aMx[5];
    printf("%d %d %d\n", p.x, p.y, v);
    return 0;
}
