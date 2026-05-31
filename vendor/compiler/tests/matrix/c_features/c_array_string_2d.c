/* 2D char array (array of fixed-size strings). */
#include <stdio.h>
int main(void) {
  char names[3][8] = { "alice", "bob", "carol" };
  for (int i = 0; i < 3; i++) printf("%s ", names[i]);
  printf("\n");
  return 0;
}
