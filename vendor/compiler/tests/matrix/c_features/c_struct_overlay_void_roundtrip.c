/* C17 §6.3.2.3 p1 (void* round-trip) + §6.5 p7 (char* aliasing) +
 *      §6.7.8 p2 (typedef name shares identity with the struct tag).
 *
 * Covers overlay items #4, #5, #6:
 *   #4 — cast laundered through void*: `void *p = bytes; struct T *sh = p;`
 *        the cast happens at assignment, not as an explicit (T*) form.
 *   #5 — cast inside arithmetic: `((struct T *)((char *)base + off))->field`
 *        pointer arithmetic chained with cast in a single expression.
 *   #6 — typedef-hidden struct-pointer cast: `typedef struct H *HPtr;` then
 *        `(HPtr)bytes` aliases `(struct H *)bytes`.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) H {
  unsigned char tag;
  int len;
};

typedef struct H *HPtr;

int main(void) {
  unsigned char buf[32];
  memset(buf, 0, sizeof buf);

  /* Item #4: void* laundering — typed assignment via void* */
  void *vp = buf;
  struct H *sh = vp;
  sh->tag = 0x55;
  sh->len = 0x11223344;
  printf("vp tag=%u len=%d\n", (unsigned)sh->tag, sh->len);

  /* Item #5: cast inside arithmetic — overlay at base+5 */
  ((struct H *)((char *)buf + 5))->tag = 0xCC;
  ((struct H *)((char *)buf + 5))->len = 0x55667788;
  printf("offset5 b5=%u b6=%u b7=%u b8=%u b9=%u\n",
         (unsigned)buf[5], (unsigned)buf[6], (unsigned)buf[7],
         (unsigned)buf[8], (unsigned)buf[9]);

  /* Item #6: typedef-hidden — HPtr is `struct H *` */
  HPtr hp = (HPtr)(buf + 10);
  hp->tag = 0xFF;
  hp->len = 7;
  printf("typedef tag=%u len=%d b10=%u b11=%u\n",
         (unsigned)hp->tag, hp->len, (unsigned)buf[10], (unsigned)buf[11]);
  return 0;
}
