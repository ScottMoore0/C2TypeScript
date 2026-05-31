/* C17 §6.8.6.1 (goto) + §6.8.4.2 (switch): pattern-dispatch idiom where
 * a label is reached either via fallthrough (default:) or via explicit
 * goto from within nested switch cases. Mirrors Lua 5.4 lstrlib.c
 * match() `default: dflt: { ... }` shape at minimum scope. */
#include <stdio.h>

static int classify(int c) {
    int result = 0;
    switch (c) {
        case 1:
            result = 100;
            break;
        case 2:
            /* goto into the default body */
            goto dflt;
        case 3: {
            /* nested switch that may goto the outer default */
            switch (c * 10) {
                case 30:
                    goto dflt;
                default:
                    result = 300;
                    break;
            }
            break;
        }
        default: dflt: {
            /* reached either by fallthrough default or explicit goto */
            int bonus = 7;
            result = 9000 + bonus;
            break;
        }
    }
    return result;
}

int main(void) {
    printf("%d\n", classify(1));  /* 100 */
    printf("%d\n", classify(2));  /* 9007 via goto from case 2 */
    printf("%d\n", classify(3));  /* 9007 via goto from nested switch */
    printf("%d\n", classify(9));  /* 9007 via default fallthrough */
    return 0;
}
