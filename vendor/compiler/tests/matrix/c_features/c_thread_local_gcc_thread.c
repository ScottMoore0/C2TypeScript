/* GCC `__thread` storage-class extension — synonym for C11 `_Thread_local`
 * per the GCC manual "Thread-Local" section. Clang surfaces both via the
 * VarDecl `tls` field; emitter must lower both identically.
 *
 * Test exercises declaration, initializer, and access of a `__thread int`.
 * This is the spelling glibc, jemalloc, and TCMalloc still use in their
 * pre-C11 codebases.
 */
#include <stdio.h>

__thread int gcc_tls = 7;

int main(void) {
  printf("%d\n", gcc_tls);
  gcc_tls = gcc_tls * 3;
  printf("%d\n", gcc_tls);
  return 0;
}
