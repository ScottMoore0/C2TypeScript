/* Recursion: mutual (is_even / is_odd). */
#include <stdio.h>
int is_even(int n);
int is_odd(int n)  { return n == 0 ? 0 : is_even(n - 1); }
int is_even(int n) { return n == 0 ? 1 : is_odd(n - 1);  }
int main(void) {
  for (int i = 0; i < 6; i++) printf("%d ", is_even(i));
  printf("\n");
  return 0;
}
