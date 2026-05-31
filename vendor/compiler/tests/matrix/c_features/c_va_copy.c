/* C17 §7.16.1.2: va_copy preserves an independent cursor.
 * After va_copy(dst, src), advancing dst must not affect src and
 * vice versa — each has its own __idx into the shared argument array.
 * This variant advances the copy FIRST, then reads from the original,
 * to confirm independence in both directions (complements
 * c_va_copy_twice.c which advances the original first). */
#include <stdio.h>
#include <stdarg.h>

static void check(int n, ...) {
    va_list ap, ap2;
    va_start(ap, n);
    va_copy(ap2, ap);
    /* Advance ap2 all the way through first. */
    int s2 = 0;
    for (int i = 0; i < n; i++) s2 += va_arg(ap2, int);
    /* ap should still be at position 0 and produce the same sum. */
    int s1 = 0;
    for (int i = 0; i < n; i++) s1 += va_arg(ap, int);
    printf("s1=%d s2=%d\n", s1, s2);
    va_end(ap);
    va_end(ap2);
}

int main(void) {
    check(3, 5, 10, 15);
    check(4, 1, 2, 3, 4);
    return 0;
}
