/* C17 §6.7.2.2 p3: each enumerator's value is one more than the value of the
 * previous enumerator, unless explicitly initialised. When the FIRST enumerator
 * has an explicit value (e.g. `A = SOMEMACRO`) that resolves to a non-trivial
 * expression at translation time, subsequent enumerators MUST still follow as
 * (prev + 1), NOT restart from 0.
 *
 * This is Lua's exact RESERVED enum shape:
 *   enum RESERVED { TK_AND = FIRST_RESERVED, TK_BREAK, TK_DO, ... };
 *
 * Bug: if the translator emits TK_DO as ordinal 2 instead of (TK_AND + 2),
 * the parser's switch-on-token-id matches the wrong branches → falls through
 * to default (exprstat) → syntax error → close-protected cycle.
 *
 * EXPECT: A=256, B=257, C=258, D=259 — all sequential from the explicit base.
 */
#include <stdio.h>

#define FIRST_RESERVED  (256)

enum E {
  A = FIRST_RESERVED,
  B,
  C,
  D
};

int main(void) {
  printf("A=%d\n", A);
  printf("B=%d\n", B);
  printf("C=%d\n", C);
  printf("D=%d\n", D);
  printf("B-A=%d\n", B - A);
  printf("D-A=%d\n", D - A);
  return 0;
}
