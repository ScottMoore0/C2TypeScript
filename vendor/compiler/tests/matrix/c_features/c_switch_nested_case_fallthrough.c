/* C17 §6.8.1: case/default labels may appear anywhere inside a switch body,
 * INCLUDING nested inside another case's compound-statement. Clang emits such
 * labels AST-structurally as nested CaseStmt children of the outer CaseStmt's
 * CompoundStmt.
 *
 * Real-world: SQLite's VDBE opcode dispatch (vdbe.c ~line 78K) uses the
 * idiom
 *   case OP_ReopenIdx: {          // outer case
 *       decl_stuff;
 *       if (cond) goto shared;
 *     case OP_OpenRead:            // nested CaseStmt inside outer's body
 *     case OP_OpenWrite:           // another nested CaseStmt
 *       shared_body_stuff;
 *     shared:
 *       more_stuff;
 *       break;
 *   }
 * to share one body across multiple opcode labels while allowing the first
 * opcode to do extra setup. TS requires every `case` at the same switch-body
 * depth, so nested cases must be lifted. */
#include <stdio.h>

static int dispatch(int op, int arg) {
    int r = 0;
    switch (op) {
        case 1: {
            r += 10;
            if (arg == 99) goto shared;
        case 2:
        case 3:
            r += 100;
        shared:
            r += 1000;
            break;
        }
        case 4: {
            r = 77;
            break;
        }
        default: {
            r = -1;
            break;
        }
    }
    return r;
}

int main(void) {
    /* op=1, arg=0 → case 1: r=10; fall into case 2/3 body → r=110; shared → r=1110 */
    printf("%d\n", dispatch(1, 0));
    /* op=1, arg=99 → case 1: r=10; goto shared → r=1010 (skip 100) */
    printf("%d\n", dispatch(1, 99));
    /* op=2 → r=100 → shared → r=1100 */
    printf("%d\n", dispatch(2, 0));
    /* op=3 → r=100 → shared → r=1100 */
    printf("%d\n", dispatch(3, 0));
    /* op=4 → r=77 */
    printf("%d\n", dispatch(4, 0));
    /* op=99 → r=-1 */
    printf("%d\n", dispatch(99, 0));
    return 0;
}
