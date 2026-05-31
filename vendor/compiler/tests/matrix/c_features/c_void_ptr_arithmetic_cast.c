/* Cast void* to (char*) for byte arithmetic. */
#include <stdio.h>
int main(void) {
  int data[3] = { 0xAA, 0xBB, 0xCC };
  void *p = data;
  int *q = (int *)((char *)p + sizeof(int) * 2);
  printf("%X\n", *q);
  return 0;
}
