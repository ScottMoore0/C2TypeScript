/* C17 §7.16.1.1: va_arg coercion for mixed types (int, double, const char *).
 * Each va_arg call specifies the requested type, and the translation must
 * coerce appropriately (Math.trunc for int, Number for double, String for
 * const char *). */
#include <stdio.h>
#include <stdarg.h>

static void dump(int n, ...) {
    va_list ap;
    va_start(ap, n);
    for (int i = 0; i < n; i++) {
        int tag = va_arg(ap, int);
        if (tag == 0) {
            int v = va_arg(ap, int);
            printf("i=%d\n", v);
        } else if (tag == 1) {
            double v = va_arg(ap, double);
            printf("d=%.2f\n", v);
        } else {
            const char *v = va_arg(ap, const char *);
            printf("s=%s\n", v);
        }
    }
    va_end(ap);
}

int main(void) {
    dump(3, 0, 42, 1, 3.25, 2, "hello");
    dump(2, 1, -0.5, 0, -7);
    return 0;
}
