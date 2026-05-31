/* C17 6.3.1.3 p3 + 6.5.7 p5 (right shift): extract high 32 bits of a
 * uint64_t via (uint32_t)(t >> 32). The shift produces a uint64_t (BigInt
 * domain in the translator); the cast must narrow to a Number. The result
 * is then mixed with Number arithmetic.
 *
 * Real-world driver: BLAKE3 portable counter_high.
 */
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint64_t t = 0x1122334455667788ULL;
    uint32_t hi = (uint32_t)(t >> 32);
    uint32_t mixed = hi + 0x10000000U;
    printf("%08x %08x\n", hi, mixed);
    return 0;
}
