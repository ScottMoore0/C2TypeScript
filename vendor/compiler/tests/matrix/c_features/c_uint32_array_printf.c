/* C17 §6.2.5 + §6.7.9: static const uint32_t array with printf.
 * Defence-in-depth for charCodeAt narrowing — 32-bit elements must NOT
 * route through string-codepoint access. */
#include <stdio.h>
#include <stdint.h>
static const uint32_t aBig[] = {1u, 2u, 3u, 4000000000u};
int main(void) {
    printf("%u %u %u %u\n", aBig[0], aBig[1], aBig[2], aBig[3]);
    return 0;
}
