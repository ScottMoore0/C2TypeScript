/* Token-paste in macro to build identifier. */
#include <stdio.h>
#define CONCAT(a, b) a##b
int CONCAT(my_, var) = 42;
int main(void) {
  printf("%d\n", CONCAT(my_, var));
  return 0;
}
