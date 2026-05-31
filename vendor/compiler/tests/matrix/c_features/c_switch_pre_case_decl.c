/* C17 §6.8.4.2: a switch body is a statement; when it is a compound-
 * statement (§6.8.2) its block-items may mix declarations and labelled
 * statements in any order. In particular a bare DeclStmt may appear
 * BEFORE the first `case` label, and its identifier is in scope for every
 * case body (block scope per §6.2.1).
 *
 * Real-world driver: SQLite's lemon-generated yy_reduce() in parse.c
 * declares `YYMINORTYPE yylhsminor;` as a sibling of the switch's first
 * CaseStmt.
 *
 * TS grammar rejects a statement between `switch (x) {` and the first
 * `case`; the emitter must hoist the DeclStmt out to the enclosing block. */
#include <stdio.h>

static int pick(int x) {
    int tmp = -1;
    switch (x) {
        int inner;  /* pre-case DeclStmt — hoisted to enclosing block in TS */
        case 1: inner = 10; tmp = inner; break;
        case 2: inner = 20; tmp = inner; break;
        case 3: inner = 30; tmp = inner; break;
        default: inner = 99; tmp = inner; break;
    }
    return tmp;
}

int main(void) {
    printf("%d\n", pick(1));
    printf("%d\n", pick(2));
    printf("%d\n", pick(3));
    printf("%d\n", pick(4));
    return 0;
}
