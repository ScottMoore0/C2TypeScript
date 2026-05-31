/* C17 §6.5.6 + §6.3.2.3 p7 — split form: arithmetic and cast in
 * separate statements. The bridge runtime must accumulate
 * __byte_delta across an intermediate that isn't a single expression.
 *
 * uthash's NO_DECLTYPE fallback path produces this shape via
 * DECLTYPE_ASSIGN; Linux's list_entry expands inline, but other
 * codebases (custom allocators, intrusive lists hand-rolled) often
 * split the form to manage subexpression order or readability.
 */
#include <stdio.h>
#include <stddef.h>

struct T {
  int header;
  int payload;
};

int main(void) {
  struct T t = { 99, 200 };
  int *p = &t.payload;
  /* Split the cast/arithmetic across two statements. */
  char *raw = (char *)p - offsetof(struct T, payload);
  struct T *recovered = (struct T *)raw;
  printf("header=%d payload=%d same=%d\n",
         recovered->header, recovered->payload, recovered == &t);
  return 0;
}
