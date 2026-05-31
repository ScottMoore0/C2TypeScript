/* C17 §6.7.2.1 p12 + §6.7.2.2: union of a uint8_t and a struct of 1-bit
 * flags. Exercises narrow (1-bit) bitfield accessors and write-through
 * via the scalar-face of the union. */
#include <stdio.h>
#include <stdint.h>

union Flags {
    uint8_t byte;
    struct {
        unsigned f0 : 1;
        unsigned f1 : 1;
        unsigned f2 : 1;
        unsigned f3 : 1;
        unsigned f4 : 1;
        unsigned f5 : 1;
        unsigned f6 : 1;
        unsigned f7 : 1;
    } b;
};

int main(void) {
    union Flags u;
    u.byte = 0;
    u.b.f0 = 1;
    u.b.f3 = 1;
    u.b.f7 = 1;
    printf("byte=%u\n", (unsigned)u.byte);
    u.byte = 0xA5u;  /* 1010 0101 */
    printf("%u %u %u %u %u %u %u %u\n",
           u.b.f0, u.b.f1, u.b.f2, u.b.f3, u.b.f4, u.b.f5, u.b.f6, u.b.f7);
    return 0;
}
