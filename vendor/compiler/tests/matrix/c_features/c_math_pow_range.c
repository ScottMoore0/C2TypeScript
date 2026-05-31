/* pow at various inputs. */
#include <stdio.h>
#include <math.h>
int main(void) {
  printf("%.2f %.2f %.4f %.2f\n", pow(2.0, 0.0), pow(2.0, 10.0), pow(10.0, 0.5), pow(0.5, 4.0));
  return 0;
}
