/* C17 §6.7.2.1 (struct/union) + §6.5.6 (array subscript) + §6.5.2.3 (struct member access):
 * Hash table of pointer buckets where each entry chains via a UNION-NESTED pointer
 * field. Mirrors Lua's internshrstr: `for (ts = *list; ts; ts = ts->u.hnext)`
 * where each TString sits in a hash bucket and chains via union field `u.hnext`.
 *
 * If the translator emits `ts->u.hnext` as anything other than a direct pointer
 * read through the union proxy, the chain walk goes infinite or returns wrong data.
 *
 * EXPECT: inserts 3 entries into bucket 0, then walks chain printing each.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node Node;

typedef struct {
  Node *hnext;
  int dummy;
} NodeChain;

struct Node {
  int key;
  union {
    NodeChain c;       /* the same union shape Lua uses */
    double pad;
  } u;
  char name[8];
};

#define NBUCKETS 4

typedef struct {
  Node *buckets[NBUCKETS];
  int  size;
} HTab;

static void ht_insert(HTab *h, int key, const char *name) {
  Node *n = (Node *)malloc(sizeof(Node));
  n->key = key;
  strncpy(n->name, name, 7);
  n->name[7] = 0;
  unsigned slot = ((unsigned)key) & (NBUCKETS - 1);
  /* chain via union field — link new node at head of bucket list */
  n->u.c.hnext = h->buckets[slot];
  h->buckets[slot] = n;
  h->size++;
}

static int ht_walk_bucket(HTab *h, int slot) {
  int count = 0;
  for (Node *n = h->buckets[slot]; n != NULL; n = n->u.c.hnext) {
    printf("[%d] key=%d name=%s\n", count, n->key, n->name);
    count++;
    if (count > 100) {                 /* safety against infinite chain */
      printf("RUNAWAY chain\n");
      return -1;
    }
  }
  return count;
}

int main(void) {
  HTab h;
  memset(&h, 0, sizeof(h));
  /* keys 0, 4, 8 all hash to slot 0 (mod 4) */
  ht_insert(&h, 0, "zero");
  ht_insert(&h, 4, "four");
  ht_insert(&h, 8, "eight");
  int n = ht_walk_bucket(&h, 0);
  printf("walked=%d size=%d\n", n, h.size);
  /* clean up */
  for (Node *cur = h.buckets[0]; cur; ) {
    Node *next = cur->u.c.hnext;
    free(cur);
    cur = next;
  }
  return 0;
}
