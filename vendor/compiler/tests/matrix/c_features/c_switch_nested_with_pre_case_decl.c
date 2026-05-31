/* Defensive interaction test: combine the round-20 nested-CaseStmt lift
 * (C17 §6.8.1 — case labels inside another case's compound-statement) with
 * the pre-case DeclStmt hoist (§6.8.4.2 — declarations before the first
 * case label). Both rewrites must compose: the pre-case DeclStmt is
 * hoisted to the enclosing block, and the nested-case lift proceeds on
 * the remaining switch-body items. */
#include <stdio.h>

static int dispatch(int op, int arg) {
    int r = 0;
    switch (op) {
        int tmp;  /* pre-case DeclStmt — hoist */
        case 1: {
            tmp = 10;
            r += tmp;
            if (arg == 99) goto shared;
        case 2:
        case 3:
            r += 100;
        shared:
            r += 1000;
            break;
        }
        case 4: {
            tmp = 5;
            r = 70 + tmp;
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
    printf("%d\n", dispatch(1, 0));   /* r=10; fall into 2/3 body → r=110; shared → r=1110 */
    printf("%d\n", dispatch(1, 99));  /* r=10; goto shared → r=1010 */
    printf("%d\n", dispatch(2, 0));   /* r=100 → shared → r=1100 */
    printf("%d\n", dispatch(3, 0));   /* r=100 → shared → r=1100 */
    printf("%d\n", dispatch(4, 0));   /* r = 70+5 = 75 */
    printf("%d\n", dispatch(99, 0));  /* default → r=-1 */
    return 0;
}
