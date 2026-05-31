/* C17 §6.7.9p21: if there are fewer initializers in a brace-enclosed list
 * than elements of an aggregate, the remainder is initialized implicitly
 * the same as objects with static storage duration (zero). Verify both
 * within-row zero-padding and missing-row zero-padding. */
#include <stdio.h>
static int a[3][3] = {{1}, {0, 2}};
int main(void) {
    int sum = 0;
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++)
            sum += a[i][j];
    /* expected: 1 + (0+2) + (0+0+0) = 3 */
    printf("%d\n", sum);
    return 0;
}
