/* C17 §6.8.6.1 (goto) + §6.8.4.2 (switch): VDBE-style computed-goto opcode
 * dispatcher. Switch over opcode; each case body is a CompoundStmt which
 * contains one or more interior labels that serve as goto targets from
 * OTHER cases. A case may `goto` a label inside a different case, which
 * requires jumping INTO another case body past its `case OP_X:` header.
 *
 * This is the pattern used in sqlite3.c sqlite3VdbeExec (case OP_Goto has
 * interior labels jump_to_p2_and_check_for_interrupt + check_for_interrupt
 * which are targeted from OP_Gosub, OP_AbortIfNull, etc. via goto from
 * within their own case bodies).
 *
 * Minimum reproduction: two opcodes with interior labels. */
#include <stdio.h>

enum { OP_GOTO = 1, OP_GOSUB = 2, OP_RET = 3 };

static int dispatch(int op, int input) {
    int pc = 0;
    int out = 0;
    int opcode = op;

    switch (opcode) {
        case OP_GOSUB: {
            /* Gosub: mark state, then fall into Goto's interior label. */
            out += 100;
            goto jump_to_p2;
        }
        case OP_GOTO: {
            /* Goto sets pc and then falls through interior labels. */
            pc = input;
        jump_to_p2:
            /* interior label inside case OP_GOTO; targeted from OP_GOSUB */
            pc = pc + 1;
        check_interrupt:
            /* interior label; also a goto target from OP_RET */
            if (pc > 1000) {
                out = -1;
                break;
            }
            out += pc;
            break;
        }
        case OP_RET: {
            out += 10;
            goto check_interrupt;
        }
        default: {
            out = -999;
            break;
        }
    }
    return out;
}

int main(void) {
    printf("%d\n", dispatch(OP_GOTO, 5));    /* pc=5; jump_to_p2 -> pc=6; check_interrupt; out=6 */
    printf("%d\n", dispatch(OP_GOSUB, 42));  /* out=100; goto jump_to_p2; pc=0+1=1; check_interrupt; out=101 */
    printf("%d\n", dispatch(OP_RET, 0));     /* out=10; goto check_interrupt; out += pc(0); out=10 */
    printf("%d\n", dispatch(99, 0));         /* default: out=-999 */
    return 0;
}
