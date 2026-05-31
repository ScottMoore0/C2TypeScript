/* C17 §6.5.2.1 (subscript) + §6.5.3.2 (address-of) — `&arr[i][j]` for
 * a 2D array. Per §6.5.2.1 p3, `arr[i]` for a 2D array yields a 1D
 * row array (with array-to-pointer decay). `&arr[i][j]` is therefore
 * a pointer to the element at row i, column j, and must translate
 * without malformed brackets.
 */
#include <stdio.h>

int main(void) {
  int arr[3][4];
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 4; j++) {
      arr[i][j] = i * 10 + j;
    }
  }

  /* &arr[i][j] — double subscript then address-of. */
  int *p = &arr[1][2];
  printf("%d\n", *p);

  /* Index by computed expressions that themselves contain subscripts. */
  int k = 0;
  int *q = &arr[arr[0][1]][k + 3];
  printf("%d\n", *q);

  /* Pointer arithmetic across 2D rows: &arr[i][0] then step. */
  int *row = &arr[2][0];
  printf("%d %d %d\n", row[0], row[1], row[3]);

  return 0;
}
