/* C17 §6.7.2.1 + §6.7.6.3 — function pointer in element of array
 * of structs. Used by command-table dispatch (shells, REPLs,
 * config parsers): each row holds a name + handler function.
 *
 * Verifies that the emitter's array-of-structs subscript +
 * struct-field-as-fnptr composition both work with the indirect
 * call.
 */
#include <stdio.h>

struct Cmd {
  int code;
  int (*handler)(int);
};

int h_zero(int x) { return 0; }
int h_one(int x)  { return x + 100; }
int h_two(int x)  { return x * 2; }

int main(void) {
  struct Cmd table[3] = {
    { 0, h_zero },
    { 1, h_one },
    { 2, h_two }
  };
  for (int i = 0; i < 3; i++) {
    printf("%d ", table[i].handler(5));
  }
  printf("\n");
  return 0;
}
