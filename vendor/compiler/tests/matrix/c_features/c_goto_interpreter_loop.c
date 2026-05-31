/* C17 §6.8.6.1 + §6.8.4.2 + §6.8.5: tight interpreter-style dispatch with
 * cross-case fall-through via interior labels. Mirrors VDBE's `case OP_X:
 * { ...; interior_label1: ...; interior_label2: ...; break; }` idiom where
 * `break` naturally exits the dispatch switch and a wrapper loop iterates.
 *
 * Single-pass variant (no wrapping while loop) to keep the interior-label
 * fall-through semantics observable without conflating loop-iteration
 * semantics. Each interp() invocation runs ONE instruction dispatch; the
 * caller re-enters as needed. */
#include <stdio.h>

enum { PUSH = 1, ADD = 2, NEG = 3, OUT = 4, HALT = 5 };

static int step(int op, int arg, int *acc, int *stack) {
    int final_rc = 0;
    switch (op) {
        case PUSH: {
            *stack = arg;
            goto normalize;
        }
        case NEG: {
            *acc = -*acc;
            goto normalize;
        }
        case ADD: {
            *acc += *stack;
        normalize:
            /* interior label: clamp accumulator to non-negative sentinel
             * range; reached via fall-through from ADD or via explicit
             * goto from PUSH/NEG. */
            if (*acc < 0) *acc = 0;
        post_normalize:
            /* second interior label: saturate upper bound; reached via
             * fall-through from `normalize` OR via goto from OUT. */
            if (*acc > 100) *acc = 100;
            final_rc = 1;
            break;
        }
        case OUT: {
            /* explicit jump into ADD's second interior label */
            goto post_normalize;
        }
        case HALT: {
            final_rc = 99;
            break;
        }
        default: {
            final_rc = -1;
            break;
        }
    }
    return final_rc;
}

int main(void) {
    int acc = 5;
    int stack = 0;
    int rc;

    /* PUSH 10 -> stack=10, normalize+post_normalize no-op on acc=5 */
    rc = step(PUSH, 10, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* ADD -> acc=5+10=15 */
    rc = step(ADD, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* NEG -> acc=-15, normalize clamps acc=0 */
    rc = step(NEG, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* ADD again -> acc=0+10=10 */
    rc = step(ADD, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* OUT -> skip normalize, run only post_normalize. acc=10, no-op */
    rc = step(OUT, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* Force overflow, then OUT -> post_normalize clamps acc=100 */
    acc = 250;
    rc = step(OUT, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* HALT */
    rc = step(HALT, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);
    /* Default */
    rc = step(77, 0, &acc, &stack);
    printf("%d %d %d\n", rc, acc, stack);

    return 0;
}
