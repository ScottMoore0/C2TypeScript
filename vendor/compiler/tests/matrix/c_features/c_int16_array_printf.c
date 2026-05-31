/* C17 §6.2.5 + §6.7.9: static const int16_t array with printf.
 * Defence-in-depth for charCodeAt narrowing — signed 16-bit elements
 * must NOT route through string-codepoint access. Negative values make
 * divergence visible if .charCodeAt were erroneously applied. */
#include <stdio.h>
#include <stdint.h>
static const int16_t aSigned[] = {-1, -32768, 32767, 0};
int main(void) {
    printf("%d %d %d %d\n", aSigned[0], aSigned[1], aSigned[2], aSigned[3]);
    return 0;
}
