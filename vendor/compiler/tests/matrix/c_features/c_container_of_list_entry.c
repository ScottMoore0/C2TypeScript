/* Linux kernel-style `list_entry` macro — the most common packaging of
 * container_of. Defined in <linux/list.h> as exactly:
 *
 *   #define list_entry(ptr, type, member) container_of(ptr, type, member)
 *
 * Used by every intrusive list in the Linux kernel and many userspace
 * libraries (libnl, mosquitto's persistence layer, ...).
 */
#include <stdio.h>
#include <stddef.h>

#define container_of(ptr, type, member) \
  ((type *)((char *)(ptr) - offsetof(type, member)))
#define list_entry(ptr, type, member) container_of(ptr, type, member)

struct list_head { struct list_head *next; };

struct task {
  int pid;
  struct list_head tasks;
  int prio;
};

int main(void) {
  struct task t1 = { 100, { 0 }, 5 };
  struct task t2 = { 200, { 0 }, 3 };
  t1.tasks.next = &t2.tasks;

  /* Recover task from list_head pointer via list_entry */
  struct list_head *p = t1.tasks.next;     /* points at t2.tasks */
  struct task *t = list_entry(p, struct task, tasks);
  printf("pid=%d prio=%d same=%d\n", t->pid, t->prio, t == &t2);
  return 0;
}
