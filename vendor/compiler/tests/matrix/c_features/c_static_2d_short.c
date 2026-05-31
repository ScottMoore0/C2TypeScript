/* C17 §6.7.9p21: nested initializer for 2D array of uint16_t (short).
 * Mirrors zlib crc32's crc_braid_table. Sum across. */
#include <stdio.h>
static const unsigned short t[3][4] = {
    {0x0001, 0x0002, 0x0003, 0x0004},
    {0x0010, 0x0020, 0x0030, 0x0040},
    {0x0100, 0x0200, 0x0300, 0x0400}
};
int main(void) {
    int sum = 0;
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 4; j++)
            sum += (int)t[i][j];
    printf("%d\n", sum);
    return 0;
}
