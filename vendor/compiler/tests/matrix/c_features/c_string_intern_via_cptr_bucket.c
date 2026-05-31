/* C17 §6.5.6 + §6.7.2.1: dynamically-allocated bucket array (`T **`) accessed via
 * pointer arithmetic, with each bucket holding a UNION-chained linked list.
 * Mirrors Lua's lstring.c internshrstr:
 *
 *   stringtable *tb = &g->strt;
 *   TString **list = &tb->hash[hash & (tb->size - 1)];
 *   for (ts = *list; ts != NULL; ts = ts->u.hnext)
 *     if (matches) return ts;
 *
 * Stress: heap-allocated bucket array (T **), pointer arithmetic on hash[i],
 * dereferencing **list, AND union-chained walk simultaneously.
 *
 * EXPECT: inserts 3 strings into bucket 0, looks up "two", prints id.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct StrNode StrNode;

typedef struct {
  StrNode *hnext;
  int id;
} ChainHdr;

struct StrNode {
  union {
    ChainHdr c;
    double pad;
  } u;
  char name[16];
};

typedef struct {
  StrNode **hash;   /* heap-alloc'd array of bucket heads */
  int size;
  int nuse;
} StrTab;

static void strtab_init(StrTab *tb, int n) {
  tb->hash = (StrNode **)calloc(n, sizeof(StrNode *));
  tb->size = n;
  tb->nuse = 0;
}

static void strtab_insert(StrTab *tb, const char *name, int id) {
  StrNode *n = (StrNode *)malloc(sizeof(StrNode));
  strncpy(n->name, name, 15);
  n->name[15] = 0;
  n->u.c.id = id;
  /* Pre-compute slot, then access bucket via dereferenced pointer arithmetic
   * — the same shape Lua uses. */
  unsigned slot = 0;                            /* all strings hash to slot 0 */
  StrNode **list = &tb->hash[slot];
  n->u.c.hnext = *list;
  *list = n;
  tb->nuse++;
}

static int strtab_find(StrTab *tb, const char *name) {
  unsigned slot = 0;
  StrNode **list = &tb->hash[slot];
  for (StrNode *ts = *list; ts != NULL; ts = ts->u.c.hnext) {
    if (strcmp(ts->name, name) == 0) {
      return ts->u.c.id;
    }
  }
  return -1;
}

int main(void) {
  StrTab tb;
  strtab_init(&tb, 4);
  strtab_insert(&tb, "one",   1);
  strtab_insert(&tb, "two",   2);
  strtab_insert(&tb, "three", 3);
  printf("find one=%d\n",   strtab_find(&tb, "one"));
  printf("find two=%d\n",   strtab_find(&tb, "two"));
  printf("find three=%d\n", strtab_find(&tb, "three"));
  printf("find none=%d\n",  strtab_find(&tb, "none"));
  printf("nuse=%d\n", tb.nuse);
  /* cleanup */
  for (StrNode *cur = tb.hash[0]; cur; ) {
    StrNode *next = cur->u.c.hnext;
    free(cur);
    cur = next;
  }
  free(tb.hash);
  return 0;
}
