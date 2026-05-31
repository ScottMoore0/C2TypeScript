/* C17 §6.5.6 + §6.7.6.2 + §6.5.3.1: lexer-style read loop with a const-char-pointer
 * cursor and counter, mirroring Lua's `zgetc(z)` pattern:
 *
 *   const char *p;     // input cursor
 *   size_t n;          // remaining bytes
 *   #define zgetc(z) ((z->n--) > 0 ? cast_uchar(*(z->p++)) : refill(z))
 *
 * Each call reads one char and advances p, decrementing n. When n hits 0,
 * calls a refill function. This pattern is in Lua's llex.c and would
 * hang if `p++` doesn't advance correctly when p was assigned from a
 * struct field that was set from a user-supplied buffer.
 *
 * EXPECT: scans input, prints each character's code, returns count.
 */
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>

typedef struct ZIO {
  const char *p;
  size_t n;
} ZIO;

static int read_char(ZIO *z) {
  if (z->n > 0) {
    z->n--;
    return (int)(unsigned char)(*z->p++);
  }
  return -1;
}

static int scan(ZIO *z) {
  int count = 0;
  while (1) {
    int c = read_char(z);
    if (c < 0) break;
    printf("c=%d\n", c);
    if (++count > 100) return -1;  /* safety */
  }
  return count;
}

int main(void) {
  const char *src = "abc";  /* 3 bytes */
  ZIO z;
  z.p = src;
  z.n = 3;
  int n = scan(&z);
  printf("count=%d\n", n);
  return 0;
}
