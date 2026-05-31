/* C17 §7.16.1.2: va_copy(dest, src) snapshots a va_list so the same
 * variadic pack can be scanned twice. Verifies that advancing `dest`
 * does not affect the original `src`. */
#include <stdio.h>
#include <stdarg.h>

static int sum_twice(int n, ...) {
    va_list ap, ap2;
    va_start(ap, n);
    va_copy(ap2, ap);
    int s1 = 0;
    for (int i = 0; i < n; i++) s1 += va_arg(ap, int);
    int s2 = 0;
    for (int i = 0; i < n; i++) s2 += va_arg(ap2, int);
    va_end(ap);
    va_end(ap2);
    printf("s1=%d s2=%d\n", s1, s2);
    return s1 + s2;
}

int main(void) {
    printf("total=%d\n", sum_twice(4, 1, 2, 3, 4));
    printf("total=%d\n", sum_twice(3, 10, 20, 30));
    return 0;
}
