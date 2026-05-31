/* C17 6.3.1.3 p3: integer conversion from u64 to u32. The translator routes
 * uint64_t through BigInt to preserve full 64-bit precision; uint32_t is
 * Number-domain. The IntegralCast at (uint32_t)t must wrap with
 * Number(BigInt.asUintN(...)) so subsequent JS Number arithmetic
 * (^, &, etc.) does not throw "Cannot mix BigInt and other types".
 *
 * Real-world driver: BLAKE3 portable counter_low / counter_high.
 */
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint64_t t = 0x1122334455667788ULL;
    uint32_t lo = (uint32_t)t;
    uint32_t mixed = lo ^ 0x12345678;
    printf("%08x %08x\n", lo, mixed);
    return 0;
}
