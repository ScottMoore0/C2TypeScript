/* C17 §6.7.2 + §6.7.9 — global array of function pointers initialised
 * at file scope. Distinct from local-array case because global
 * initialisers are evaluated once at module load (translator must
 * resolve forward references when functions are defined later in
 * the TU).
 */
#include <stdio.h>

int op0(int x);
int op1(int x);
int op2(int x);

static int (*const g_ops[3])(int) = { op0, op1, op2 };

int op0(int x) { return x; }
int op1(int x) { return x + 100; }
int op2(int x) { return x * x; }

int main(void) {
  for (int i = 0; i < 3; i++) printf("%d ", g_ops[i](5));
  printf("\n");
  return 0;
}
