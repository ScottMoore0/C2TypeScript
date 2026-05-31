/* Array of struct pointers. */
#include <stdio.h>
struct S { int v; };
int main(void) {
  struct S a = {1}, b = {2}, c = {3};
  struct S *arr[] = { &a, &b, &c };
  for (int i = 0; i < 3; i++) printf("%d ", arr[i]->v);
  printf("\n");
  return 0;
}
