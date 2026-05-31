/* C17 §6.5.8 + §6.7.2.1: pointer comparison where operands are pointers to
 * an inline struct member overlaid on a shared byte buffer (cptr_struct_overlay
 * in the TS lowering). Mirrors Lua's stack walk:
 *
 *   while (L->tbclist.p >= level)
 *
 * where both tbclist.p and level are StkId pointers (StackValue *) into the
 * SAME underlying stack byte buffer. The translator must compare byte offsets
 * within the shared buffer rather than collapsing through the cross-buf
 * intptr path (which yields a non-spatial ordering and breaks the loop).
 *
 * EXPECT: walks 5 struct entries in a flat array using StkId-typedef pointers,
 *         prints count, terminates.
 */
#include <stdio.h>
#include <string.h>

typedef struct StackValue {
  long long val;
  int       tag;
} StackValue;

typedef StackValue *StkId;        /* typedef'd pointer alias */

typedef struct {
  StackValue stack[8];
  StkId      top;
  StkId      tbclist;
} StateLike;

int main(void) {
  StateLike L;
  memset(&L, 0, sizeof L);
  for (int i = 0; i < 5; i++) { L.stack[i].val = 10 + i; L.stack[i].tag = i; }
  L.top     = &L.stack[5];
  L.tbclist = &L.stack[0];        /* bottom of stack */
  StkId level = &L.stack[3];
  int count = 0;
  /* Walk stack down from top-1 while pointer >= level (typedef'd alias). */
  for (StkId p = L.top - 1; p >= level; p--) {
    printf("[%d] val=%lld tag=%d\n", count, p->val, p->tag);
    count++;
    if (count > 10) { printf("RUNAWAY\n"); return 1; }
  }
  printf("count=%d\n", count);
  /* And the sentinel loop shape Lua uses: tbclist.p >= level → must be false here. */
  if (L.tbclist >= level) {
    printf("tbclist >= level (WRONG)\n");
  } else {
    printf("tbclist < level (OK)\n");
  }
  return 0;
}
