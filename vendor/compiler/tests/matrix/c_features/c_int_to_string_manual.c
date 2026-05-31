/* Convert int to decimal string by hand. */
#include <stdio.h>
#include <string.h>
void itoa_dec(int n, char *out) {
  char buf[16];
  int i = 0, neg = n < 0;
  if (neg) n = -n;
  if (n == 0) buf[i++] = '0';
  while (n) { buf[i++] = '0' + n % 10; n /= 10; }
  int j = 0;
  if (neg) out[j++] = '-';
  for (int k = i - 1; k >= 0; k--) out[j++] = buf[k];
  out[j] = 0;
}
int main(void) {
  char b[16];
  itoa_dec(0, b); printf("%s ", b);
  itoa_dec(42, b); printf("%s ", b);
  itoa_dec(-1234, b); printf("%s\n", b);
  return 0;
}
