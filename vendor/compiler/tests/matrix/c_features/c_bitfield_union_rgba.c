/* C17 §6.7.2.1 p12 + §6.7.2.2: union overlaying a uint32_t and a
 * 4-channel RGBA bitfield struct. Sets the scalar, reads each channel;
 * sets each channel, reads the scalar. Exercises bitfield-in-union
 * read/write through both faces of the union. */
#include <stdio.h>
#include <stdint.h>

union Pixel {
    uint32_t raw;
    struct {
        unsigned r : 8;
        unsigned g : 8;
        unsigned b : 8;
        unsigned a : 8;
    } c;
};

int main(void) {
    union Pixel px;
    px.raw = 0x11223344u;
    printf("%u %u %u %u\n", px.c.r, px.c.g, px.c.b, px.c.a);
    px.c.r = 0xDE;
    px.c.g = 0xAD;
    px.c.b = 0xBE;
    px.c.a = 0xEF;
    printf("%08X\n", px.raw);
    return 0;
}
