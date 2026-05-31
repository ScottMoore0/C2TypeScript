/* Tiny RPN calculator. */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
int main(void) {
  int stack[16];
  int top = 0;
  const char *tokens[] = { "3", "4", "+", "2", "*", "5", "-" };
  int n = 7;
  for (int i = 0; i < n; i++) {
    if (strlen(tokens[i]) == 1 && strchr("+-*/", tokens[i][0])) {
      int b = stack[--top], a = stack[--top];
      switch (tokens[i][0]) {
        case '+': stack[top++] = a + b; break;
        case '-': stack[top++] = a - b; break;
        case '*': stack[top++] = a * b; break;
        case '/': stack[top++] = a / b; break;
      }
    } else stack[top++] = atoi(tokens[i]);
  }
  printf("%d\n", stack[top - 1]);
  return 0;
}
