/* Pointer subtraction across distinct CPtr buffers — should give a
 * deterministic answer, not NaN. C17 §6.5.6 p9 says UB for unrelated
 * pointers, but real CPUs give a consistent integer result. */
#include <stdio.h>
#include <stdlib.h>
int main(void) {
    int *a = (int*)malloc(4 * sizeof(int));
    int *b = (int*)malloc(4 * sizeof(int));
    a[0]=1; a[1]=2; a[2]=3; a[3]=4;
    b[0]=10; b[1]=20; b[2]=30; b[3]=40;
    /* Same-buf subtraction: well-defined. */
    int d_same = (a+3) - a;
    printf("same=%d\n", d_same);
    /* Cross-buf comparison: deterministic per-process even if formally UB. */
    int cmp = (a < b) ? 1 : (a > b ? -1 : 0);
    printf("cmp_nonzero=%d\n", cmp != 0);  /* 1 — they differ */
    /* Cross-buf equality: well-defined when both are valid (not equal). */
    printf("eq=%d\n", a == b);
    /* Zero-element addresses: well-defined. */
    printf("a_self_eq=%d\n", a == a);
    free(a); free(b);
    return 0;
}
