/* C17 §6.5.3.2 + §6.5.16: take address of a struct field, pass to a
 * helper, helper mutates through the pointer, caller observes the
 * mutation. The canonical idiom in macro libraries (klib kvec, rxi-vec,
 * stb-ds, uthash) where vec_push expands to:
 *
 *   helper(&v->data, &v->length, &v->capacity, sizeof(...))
 *   helper { *length = ...; *capacity = ...; *data = realloc(...) }
 *
 * The C-level fact: the writes inside `helper` must be visible via
 * `v->data`, `v->length`, `v->capacity` after the call. The translator's
 * box-ref model must propagate `*p = val` from helper back to v's field.
 *
 * Pre-fix translator behaviour: emitted `{value: v.data}` literal at
 * the call site — a fresh throwaway box. Mutations were lost.
 *
 * Post-fix: emits a getter/setter proxy that re-evaluates v.data on
 * every access, so writes via box.value land on v.data.
 */
#include <stdio.h>

struct V { int data; int length; int capacity; };

static void helper(int *data, int *length, int *capacity) {
  *length = *length + 1;
  *capacity = *capacity * 2 + 1;
  *data = *length * 100 + *capacity;
}

int main(void) {
  struct V v = { 0, 0, 0 };
  helper(&v.data, &v.length, &v.capacity);
  printf("data=%d length=%d capacity=%d\n", v.data, v.length, v.capacity);
  /* Expected: length=1, capacity=1, data = 1*100 + 1 = 101 */

  /* Second call to verify cumulative mutation. */
  helper(&v.data, &v.length, &v.capacity);
  printf("data=%d length=%d capacity=%d\n", v.data, v.length, v.capacity);
  /* Expected: length=2, capacity=3, data = 2*100 + 3 = 203 */

  /* Comparison-with-zero through a deref-ref-param: makes sure
   * `*capacity == 0` doesn't get rewritten to `capacity == null`. */
  v.length = 0; v.capacity = 0; v.data = 99;
  helper(&v.data, &v.length, &v.capacity);
  printf("after-reset data=%d length=%d capacity=%d\n", v.data, v.length, v.capacity);
  return 0;
}
