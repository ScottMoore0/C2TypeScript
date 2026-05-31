/* C17 §7.13.2.1p2: "The longjmp function cannot cause setjmp to return the
 * value 0; if val is 0, setjmp returns the value 1." */
#include <stdio.h>
#include <setjmp.h>
static jmp_buf env;
int main(void) {
    int v = setjmp(env);
    if (v == 0) {
        printf("first\n");
        longjmp(env, 0);
    }
    printf("second: v=%d\n", v);
    return 0;
}
