/* Q16.16 fixed-point. */
#include <stdio.h>
typedef int q1616;
#define Q_ONE (1 << 16)
q1616 q_add(q1616 a, q1616 b) { return a + b; }
q1616 q_mul(q1616 a, q1616 b) { return (int)(((long long)a * b) >> 16); }
int q_int(q1616 q) { return q >> 16; }
int main(void) {
  q1616 a = (3 << 16);
  q1616 b = (4 << 16);
  q1616 c = q_mul(a, b);
  printf("%d\n", q_int(c));
  return 0;
}
