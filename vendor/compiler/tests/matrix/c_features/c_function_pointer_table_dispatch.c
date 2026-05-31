/* Dispatch table of named handlers. */
#include <stdio.h>
#include <string.h>
struct Cmd { const char *name; void (*fn)(void); };
void cmd_a(void) { printf("A "); }
void cmd_b(void) { printf("B "); }
void cmd_c(void) { printf("C "); }
int main(void) {
  struct Cmd cmds[] = { {"a", cmd_a}, {"b", cmd_b}, {"c", cmd_c} };
  const char *seq[] = { "b", "c", "a", "b" };
  for (int i = 0; i < 4; i++)
    for (int j = 0; j < 3; j++)
      if (strcmp(cmds[j].name, seq[i]) == 0) cmds[j].fn();
  printf("\n");
  return 0;
}
