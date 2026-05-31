/* C17 §7.16.1.1: va_arg with a fixed interleaving of int, double, and
 * const char *. Complements c_va_arg_mixed_types.c (which uses tag-based
 * dispatch) by exercising a positionally-fixed argument sequence so the
 * va_arg cursor advancement is tested in a straight line. */
#include <stdio.h>
#include <stdarg.h>

static void show(const char *fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    int i = va_arg(ap, int);
    double d = va_arg(ap, double);
    const char *s = va_arg(ap, const char *);
    printf("i=%d d=%.2f s=%s\n", i, d, s);
    va_end(ap);
}

int main(void) {
    show("x", 7, 1.5, "ok");
    show("y", -3, 2.75, "end");
    return 0;
}
