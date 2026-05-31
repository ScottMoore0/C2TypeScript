/* C17 §6.7.2.1 + dynamic-array pattern: a struct field of type `T *` is
 * conceptually an array, often grown via `luaM_growvector`-style macros
 * that resolve to `(T *)realloc_like_call(...)`.
 *
 * Lua's `Dyndata.actvar.arr` is the canonical user. If the translator
 * models the `T *arr` field as `T | null` (a single instance) AND the
 * grow-call's cast-to-T-pointer emit replaces the rhs with `new T()`,
 * the first growth ZEROS the array (overwrites with a fresh single T)
 * and every subsequent insert clobbers the previous one.
 *
 * This test exercises: (1) declare a struct with `T *arr` field;
 * (2) "grow" via an external void*-returning call cast to `T *`;
 * (3) read element index 1 to confirm it's distinct from element 0.
 *
 * EXPECT: a[0]=10 a[1]=20.
 */
#include <stdio.h>
#include <stdlib.h>

typedef struct { int v; } Elem;

typedef struct {
  Elem *arr;
  int   n;
  int   size;
} Box;

static void *my_grow(void *old, int new_size_bytes) {
  return realloc(old, new_size_bytes);
}

int main(void) {
  Box b = { NULL, 0, 0 };
  b.arr  = (Elem *)my_grow(b.arr, 2 * sizeof(Elem));
  b.size = 2;
  b.arr[0].v = 10;
  b.arr[1].v = 20;
  b.n = 2;
  printf("a[0]=%d a[1]=%d\n", b.arr[0].v, b.arr[1].v);
  free(b.arr);
  return 0;
}
