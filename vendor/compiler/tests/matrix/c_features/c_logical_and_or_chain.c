/* C17 §6.5.13/§6.5.14 — chained && and || with side-effect tracking. */
#include <stdio.h>
int n = 0;
int yes(void) { n++; return 1; }
int no(void)  { n++; return 0; }
int main(void) {
  int r1 = no()  && yes();   /* short-circuits at no(); n=1 */
  int r2 = yes() || no();    /* short-circuits at yes(); n=2 */
  int r3 = yes() && yes();   /* both eval; n=4 */
  printf("%d %d %d n=%d\n", r1, r2, r3, n);
  return 0;
}
