/* C17 §6.5.17 + §6.8.5.3: comma operator in the for-statement's init and
 * update clauses. Both sides of each comma must be evaluated at each step
 * (left-to-right with a sequence point between). */
#include <stdio.h>
int main(void) {
    int i, j;
    for (i = 0, j = 5; i < j; i++, j--) {
        printf("i=%d j=%d\n", i, j);
    }
    printf("final i=%d j=%d\n", i, j);
    return 0;
}
