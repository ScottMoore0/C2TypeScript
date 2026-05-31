/* Global struct init. */
#include <stdio.h>
struct Cfg { int port; const char *name; double rate; };
struct Cfg config = { .port = 8080, .name = "server", .rate = 0.5 };
int main(void) {
  printf("%d %s %.1f\n", config.port, config.name, config.rate);
  return 0;
}
