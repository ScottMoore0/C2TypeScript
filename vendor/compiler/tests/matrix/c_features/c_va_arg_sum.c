/* C17 §7.16.1.1: va_arg over a plain int variadic.
 * This variant uses a 4-arg sum call (sum(4, 10, 20, 30, 40)) and
 * verifies the result is 100, complementing the existing
 * c_va_arg_simple.c which uses a different argument pattern. */
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
    printf("%d\n", sum(4, 10, 20, 30, 40));
    return 0;
}
