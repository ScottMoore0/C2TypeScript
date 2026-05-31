/* C17 §7.16.1.1: va_arg(ap, int) on a plain int-only variadic.
 * Verifies va_start snapshots the rest-args, va_arg advances the
 * position, and va_end cleans up. */
#include <stdio.h>
#include <stdarg.h>

static int sum(int n, ...) {
    va_list ap;
    va_start(ap, n);
    int s = 0;
    for (int i = 0; i < n; i++) s += va_arg(ap, int);
    va_end(ap);
    return s;
}

int main(void) {
    printf("%d\n", sum(3, 10, 20, 30));
    printf("%d\n", sum(5, 1, 2, 3, 4, 5));
    printf("%d\n", sum(0));
    return 0;
}
