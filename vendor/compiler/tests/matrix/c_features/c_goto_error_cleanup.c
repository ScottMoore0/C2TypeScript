/* C17 §6.8.6.1: canonical C error-handling idiom — labeled goto to
 * a cleanup block from multiple sites. This is the single most common
 * goto pattern in production C code. Tests function-body-level label
 * reached from multiple goto sites at varying depths. */
#include <stdio.h>

static int compute(int a, int b, int c) {
    int result = 0;
    int errcode = 0;

    if (a < 0) {
        errcode = 1;
        goto cleanup;
    }
    result += a;

    if (b < 0) {
        errcode = 2;
        goto cleanup;
    }
    result += b;

    /* nested scope with its own goto */
    {
        if (c < 0) {
            errcode = 3;
            goto cleanup;
        }
        result += c;
    }

    /* normal path falls into cleanup too */
cleanup:
    /* shared cleanup — records the error or success path */
    if (errcode != 0) {
        return -errcode;
    }
    return result;
}

int main(void) {
    printf("%d\n", compute(1, 2, 3));    /* 6 */
    printf("%d\n", compute(-1, 2, 3));   /* -1 */
    printf("%d\n", compute(1, -2, 3));   /* -2 */
    printf("%d\n", compute(1, 2, -3));   /* -3 */
    printf("%d\n", compute(0, 0, 0));    /* 0 */
    return 0;
}
