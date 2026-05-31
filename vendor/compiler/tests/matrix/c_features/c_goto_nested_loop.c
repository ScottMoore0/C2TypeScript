/* C17 §6.8.6.1: goto inside nested loop, both forward (to cleanup outside
 * outer loop) and backward (to re-enter outer loop). Exercises the state
 * machine lowering for cross-loop transitions. */
#include <stdio.h>

int main(void) {
    int i = 0;
    int j = 0;
    int sum = 0;
    int attempts = 0;

retry:
    attempts++;
    i = 0;
    while (i < 3) {
        j = 0;
        while (j < 3) {
            if (i == 1 && j == 2) {
                /* forward goto out of both loops */
                goto done;
            }
            sum += i * 10 + j;
            if (i == 0 && j == 0 && attempts == 1) {
                /* backward goto to re-enter outer loop */
                sum = 1000;
                goto retry;
            }
            j++;
        }
        i++;
    }

done:
    printf("%d %d\n", sum, attempts);
    return 0;
}
