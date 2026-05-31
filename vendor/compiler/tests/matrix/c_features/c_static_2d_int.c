/* C17 §6.7.9p21: nested initializer for 2D array of arithmetic type.
 * Inner lists initialize rows. Access via m[i][j]. */
#include <stdio.h>
static const int m[2][3] = {{1, 2, 3}, {4, 5, 6}};
int main(void) {
    printf("%d\n", m[1][2]);
    return 0;
}
