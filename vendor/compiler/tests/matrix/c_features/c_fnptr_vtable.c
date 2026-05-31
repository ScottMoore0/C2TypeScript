/* C17 §6.7.2.1 + §6.7.6.3 — vtable pattern: struct of multiple
 * function-pointer fields, dispatched dynamically.
 *
 * The OOP-in-C dispatch pattern used by GTK, libuv, GStreamer,
 * cURL backends, ALSA, X11. Each instance carries a vtable pointer;
 * methods are called as `instance->vt->method(instance, args)`.
 */
#include <stdio.h>
#include <stdlib.h>

struct Shape;
struct ShapeVT {
  int (*area)(struct Shape *);
  int (*perimeter)(struct Shape *);
};
struct Shape {
  struct ShapeVT *vt;
  int w, h;
};

int rect_area(struct Shape *s) { return s->w * s->h; }
int rect_perimeter(struct Shape *s) { return 2 * (s->w + s->h); }
int sq_area(struct Shape *s) { return s->w * s->w; }
int sq_perimeter(struct Shape *s) { return 4 * s->w; }

int main(void) {
  struct ShapeVT rect_vt = { rect_area, rect_perimeter };
  struct ShapeVT sq_vt = { sq_area, sq_perimeter };
  struct Shape *r = (struct Shape *)malloc(sizeof(struct Shape));
  struct Shape *q = (struct Shape *)malloc(sizeof(struct Shape));
  r->vt = &rect_vt; r->w = 4; r->h = 3;
  q->vt = &sq_vt;   q->w = 5; q->h = 0;
  printf("r.area=%d r.perim=%d q.area=%d q.perim=%d\n",
         r->vt->area(r), r->vt->perimeter(r),
         q->vt->area(q), q->vt->perimeter(q));
  free(r); free(q);
  return 0;
}
