/* C17 §7.16: forwarding a va_list to another variadic helper.
 * The outer function builds a va_list with va_start and passes it to
 * vprintf which accepts (fmt, va_list). This exercises the shim's
 * va_list-aware argument spread. */
#include <stdio.h>
#include <stdarg.h>

static int my_printf(const char *fmt, ...) {
    va_list ap;
    va_start(ap, fmt);
    int n = vprintf(fmt, ap);
    va_end(ap);
    return n;
}

int main(void) {
    my_printf("i=%d d=%.2f s=%s\n", 7, 1.5, "ok");
    my_printf("%d %d %d\n", 100, 200, 300);
    return 0;
}
