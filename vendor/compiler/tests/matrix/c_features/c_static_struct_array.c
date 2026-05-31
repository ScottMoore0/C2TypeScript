/* C17 §6.7.9p20: nested initializer list for array of struct.
 * Each sub-list initializes one struct element. */
#include <stdio.h>
struct P { int x; int y; };
static struct P ps[] = {{1, 2}, {3, 4}, {5, 6}};
int main(void) {
    printf("%d\n", ps[1].y);
    return 0;
}
