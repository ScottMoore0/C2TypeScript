/* C17 §6.5.16 p3 + §6.3.2.3 p7: type-punned assignment via reinterpret-
 * cast through a local pointer's address.
 *
 *   *(char**)&tmp = (char*)src;
 *
 * Semantics: write src into tmp's storage. The cast lets the writer
 * bypass C's type system; the result is the same as `tmp = (T)src`.
 *
 * uthash's NO_DECLTYPE fallback uses this idiom in DECLTYPE_ASSIGN.
 * Pre-fix translator: emitted `tmp.value = ...` because the **-write
 * rule treated the local pointer as if it were a {value:T} box. tmp
 * was declared as a plain pointer (not a box), so `null.value = ...`
 * NPE'd at runtime.
 */
#include <stdio.h>
#include <stdlib.h>

int main(void) {
  int *src = (int *)malloc(sizeof(int));
  *src = 42;
  int *tmp = NULL;

  /* Type-pun assignment: write src into tmp's storage. */
  *(char**)&tmp = (char*)src;

  /* tmp now points at src's int. */
  printf("tmp=%d\n", *tmp);
  /* Expected: tmp=42 */

  free(src);
  return 0;
}
