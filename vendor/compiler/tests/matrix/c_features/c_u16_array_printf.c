/* C17 §6.2.5 + §6.7.9: static const u16 (unsigned short) array with printf.
 * Regression for round-8 SQLite probe: u16 array element was being emitted
 * as .charCodeAt(i). u16 is a 16-bit integer, NOT a character type. */
#include <stdio.h>
typedef unsigned short u16;
static const u16 aMx[] = {100, 200, 300, 65535};
int main(void) {
    printf("%d %d %d %u\n", aMx[0], aMx[1], aMx[2], (unsigned)aMx[3]);
    return 0;
}
