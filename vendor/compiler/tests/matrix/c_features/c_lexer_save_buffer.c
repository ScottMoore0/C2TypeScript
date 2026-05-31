/* C17 §6.5.6 + §6.7.6.3: lexer with a SAVE-buffer that grows during
 * identifier scanning. Mirrors Lua's `save_and_next(ls)` pattern:
 *
 *   ls->buff is a dynamic buffer (Mbuffer)
 *   save() appends current char to buff, growing as needed
 *   next() advances the input cursor
 *   Identifier scanning loops both until non-alnum.
 *
 * Stress: char-by-char growth of a heap buffer while ALSO advancing
 * the input cursor. If either advance fails, infinite loop.
 *
 * EXPECT: scans identifier "hello", prints it.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stddef.h>

typedef struct ZIO {
  size_t n;
  const char *p;
} ZIO;

typedef struct LexState {
  ZIO *z;
  int current;
  char *buff;
  size_t bufflen;
  size_t buffsize;
} LexState;

static int z_getc(ZIO *z) {
  if (z->n > 0) {
    z->n--;
    return (int)(unsigned char)(*z->p++);
  }
  return -1;
}

static void next(LexState *ls) {
  ls->current = z_getc(ls->z);
}

static void save(LexState *ls, int c) {
  if (ls->bufflen + 1 >= ls->buffsize) {
    size_t newsize = (ls->buffsize == 0) ? 8 : ls->buffsize * 2;
    ls->buff = (char *)realloc(ls->buff, newsize);
    ls->buffsize = newsize;
  }
  ls->buff[ls->bufflen++] = (char)c;
}

static void save_and_next(LexState *ls) {
  save(ls, ls->current);
  next(ls);
}

static void scan_identifier(LexState *ls) {
  do {
    save_and_next(ls);
  } while (ls->current >= 0 && isalnum(ls->current));
  save(ls, 0);  /* null-terminate */
  printf("ident=%s\n", ls->buff);
}

int main(void) {
  ZIO z;
  z.p = "hello world";
  z.n = 11;
  LexState ls;
  ls.z = &z;
  ls.buff = NULL;
  ls.bufflen = 0;
  ls.buffsize = 0;
  next(&ls);  /* prime current */
  if (isalpha(ls.current)) {
    scan_identifier(&ls);
  }
  free(ls.buff);
  return 0;
}
