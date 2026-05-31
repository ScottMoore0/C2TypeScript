/* Simple stack with int. */
#include <stdio.h>
#define N 16
int stack[N];
int top = 0;
void push(int v) { stack[top++] = v; }
int  pop(void)   { return stack[--top]; }
int main(void) {
  push(1); push(2); push(3); push(4);
  while (top) printf("%d ", pop());
  printf("\n");
  return 0;
}
