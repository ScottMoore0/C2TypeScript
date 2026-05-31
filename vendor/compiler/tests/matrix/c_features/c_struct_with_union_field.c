/* C17 §6.7.2.1 — struct containing a named union field.
 *
 * Lua's CallInfo pattern: `struct CallInfo { union { struct {} l;
 * struct {} c; } u; ... };` — the union member must be constructed
 * AND each of its inner anonymous structs (l and c) must also be
 * recursively constructed so the field accesses work.
 */
#include <stdio.h>

struct CallInfo {
  int top;
  union {
    struct { int kind; int arg; } l;
    struct { int func; int args; } c;
  } u;
  int depth;
};

int main(void) {
  struct CallInfo ci = {0};
  ci.top = 1;
  ci.u.l.kind = 7;     /* requires ci.u and ci.u.l to be constructed */
  ci.u.l.arg = 8;
  ci.u.c.func = 9;     /* in C this aliases over l, but we just check no crash */
  ci.u.c.args = 10;
  ci.depth = 99;
  printf("top=%d func=%d args=%d depth=%d\n", ci.top, ci.u.c.func, ci.u.c.args, ci.depth);
  return 0;
}
