/* C17 §6.5.3.2 p3 + §6.5.2.1 p2 — address-of an array subscript.
 * `&arr[expr]` is equivalent to `(arr) + (expr)`, a pointer whose value
 * can be read back as a struct reference. This test validates the form
 * `struct S *p = &arr[2]` and pointer arithmetic access via (p + 0)->field
 * / *p.field, which is the pattern SQLite uses inside the VDBE dispatch
 * (`pOp = &aOp[i]`) and then reads `pOp->...`.
 *
 * Pointer difference and `(p + i)->field` exercise the struct-pointer
 * {__arr, __idx} lowering pipeline. The bracket-mismatch bug (G11) made
 * the translator produce syntactically malformed TS for nested `&arr[expr]`
 * idioms; this test locks down the happy path of that lowering.
 */
#include <stdio.h>

struct S { int a; int b; };

int main(void) {
  struct S arr[5];
  for (int i = 0; i < 5; i++) { arr[i].a = i; arr[i].b = i * 10; }

  struct S *first = &arr[0];
  struct S *second = &arr[1];
  struct S *last = &arr[4];

  long diff = last - first;
  printf("%ld\n", diff);
  printf("%d %d\n", (first + 2)->a, (first + 2)->b);
  printf("%d %d\n", (second + 1)->a, (second + 1)->b);
  printf("%d %d\n", (last + 0)->a, (last + 0)->b);
  return 0;
}
