/* C17 §6.7.6.3 + §6.5.6: lexer-style read loop with a READER CALLBACK
 * (function pointer) that returns a const char* buffer. This is Lua's
 * exact ZIO/lua_Reader pattern:
 *
 *   typedef const char * (*Reader)(void *ud, size_t *size);
 *   ZIO has reader + data + cursor (p, n)
 *   zgetc() refills via reader when n hits 0
 *
 * If the reader-returned buffer doesn't propagate through the assignment
 * `z->p = buff`, lexer hangs reading the same char repeatedly.
 *
 * EXPECT: scans entire input via reader, returns total count.
 */
#include <stdio.h>
#include <stddef.h>

typedef const char *(*Reader)(void *ud, size_t *size);

typedef struct ZIO {
  size_t n;
  const char *p;
  Reader reader;
  void *data;
} ZIO;

typedef struct LoadS {
  const char *s;
  size_t size;
} LoadS;

static const char *getS(void *ud, size_t *size) {
  LoadS *ls = (LoadS *)ud;
  if (ls->size == 0) return 0;
  *size = ls->size;
  ls->size = 0;
  return ls->s;
}

static int z_fill(ZIO *z) {
  size_t size;
  const char *buff = z->reader(z->data, &size);
  if (buff == 0 || size == 0) return -1;
  z->n = size - 1;
  z->p = buff;
  return (int)(unsigned char)(*z->p++);
}

static int z_getc(ZIO *z) {
  if (z->n > 0) {
    z->n--;
    return (int)(unsigned char)(*z->p++);
  }
  return z_fill(z);
}

static int scan(ZIO *z) {
  int count = 0;
  while (1) {
    int c = z_getc(z);
    if (c < 0) break;
    printf("c=%d\n", c);
    if (++count > 100) return -1;
  }
  return count;
}

int main(void) {
  LoadS ls;
  ls.s = "abc";
  ls.size = 3;
  ZIO z;
  z.n = 0;
  z.p = 0;
  z.reader = getS;
  z.data = &ls;
  int n = scan(&z);
  printf("count=%d\n", n);
  return 0;
}
