/* C17 §7.19 p3: `offsetof(type, field)` must yield the byte offset of `field`
 * within `type` as a compile-time constant. Mirrors Lua's sizelstring(l):
 *
 *   #define sizelstring(l) (offsetof(TString, contents) + (l+1)*sizeof(char))
 *
 * If the translator emits `offsetof(...)` as constant 0, the computed
 * allocation size is too small to hold the struct header — subsequent
 * writes to header fields silently fail (out-of-bounds TypedArray writes
 * are silent in JS) and downstream reads return 0, mis-tagging the object.
 *
 * EXPECT: prints the offset of `contents` (non-zero) and the computed size.
 */
#include <stdio.h>
#include <stddef.h>

typedef struct {
  void  *next;
  int    tt;
  int    marked;
  int    extra;
  int    shrlen;
  unsigned int hash;
  long long lnglen;
  char   contents[1];
} TStringLike;

#define sizelike(l) (offsetof(TStringLike, contents) + ((l) + 1) * sizeof(char))

int main(void) {
  size_t off = offsetof(TStringLike, contents);
  size_t sz  = sizelike(5);
  printf("offset=%zu\n", off);
  printf("size_5=%zu\n", sz);
  printf("ok=%d\n", off > 0 && sz > off);
  return 0;
}
