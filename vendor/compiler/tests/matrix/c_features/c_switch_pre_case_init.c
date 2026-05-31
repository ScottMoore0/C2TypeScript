/* C17 §6.8.4.2 + §6.7.9: a DeclStmt with an initializer may appear before
 * the first `case` of a switch body. Per §6.8.4.2 p4 that initializer is
 * skipped by the switch dispatch (the jump goes straight to the selected
 * case label), so portable C code must not rely on the initial value — it
 * treats the variable as write-first-read-later inside each case arm.
 *
 * This is exactly the SQLite yy_reduce() pattern: `YYMINORTYPE yylhsminor;`
 * declared before the first case, then each case assigns `yylhsminor.yyNN = ...`
 * before any read.
 *
 * This test verifies: (a) the hoisted DeclStmt with initializer compiles
 * cleanly in both C and TS, (b) each case writes before read so the
 * init-skipped-by-jump semantics don't bite, (c) references inside case
 * arms resolve to the hoisted binding. */
#include <stdio.h>

static int compute_seed(void) {
    return 42;
}

static int apply(int op) {
    int out;
    switch (op) {
        int t = compute_seed();  /* initializer runs before switch dispatch in the hoisted form */
        case 1: t = 100; out = t; break;
        case 2: t = 200; out = t + 1; break;
        default: t = 0; out = t; break;
    }
    return out;
}

int main(void) {
    printf("%d\n", apply(1));
    printf("%d\n", apply(2));
    printf("%d\n", apply(9));
    return 0;
}
