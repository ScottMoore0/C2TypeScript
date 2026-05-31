/* C17 §6.7.2.1 — anonymous nested struct inside a union.
 *
 * The Lua TValue / Node hash-table pattern. The union has an
 * anonymous nested struct (named only by member, not by tag).
 * Field accesses go through `u.member.field`. The translator must
 * synthesise a class for the anonymous nested struct so the field
 * type resolves, and recursively construct the instance.
 */
#include <stdio.h>

union Cell {
  struct {
    int key_tt;
    int next;
    int x;
  } u;
  int direct;
};

int main(void) {
  union Cell c = {0};
  c.u.key_tt = 1;
  c.u.next = 2;
  c.u.x = 99;
  printf("kt=%d nx=%d x=%d\n", c.u.key_tt, c.u.next, c.u.x);
  return 0;
}
