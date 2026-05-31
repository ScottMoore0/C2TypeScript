/* C17 §6.7.9p10: objects with static storage duration and no explicit
 * initializer are zero-initialized. For a 2D array `static int arr[3][4]`
 * all 12 ints must start as 0, and individual elements must remain
 * addressable as arr[i][j]. The emitter must produce a nested array,
 * not `undefined` and not a flat 1D array. */
#include <stdio.h>
static int arr[3][4];
int main(void) {
    arr[1][2] = 7;
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 4; j++)
            printf("%d ", arr[i][j]);
    putchar('\n');
    return 0;
}
