/* C17 §6.7.2.1 + §6.5.6 + §6.8.5: bytecode VM where the bytecode array is
 * a FIELD OF A HEAP-ALLOCATED STRUCT, accessed via pointer-to-struct.
 * This is Lua 5.4's exact pattern:
 *   typedef struct Proto { Instruction *code; ... } Proto;
 *   Proto *p = malloc(...);  p->code = malloc(N * sizeof(Instruction));
 *   pc = p->code;
 *   while(1) { i = *pc++; ... }
 *
 * Adds two stresses over c_bytecode_vm_dispatch.c:
 *   1. The bytecode is reached via `proto->code` (heap-allocated)
 *   2. pc is initialized from a struct field, not a local array
 *
 * EXPECT: translated TS produces identical output to gcc.
 */
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

enum { OP_LOADI = 1, OP_ADD = 2, OP_PRINT = 3, OP_HALT = 4 };

typedef uint32_t Instruction;

typedef struct Proto {
  Instruction *code;
  int sizecode;
} Proto;

static uint32_t enc(uint8_t op, uint8_t a, uint8_t b, uint8_t c) {
  return ((uint32_t)op) | ((uint32_t)a << 8) | ((uint32_t)b << 16) | ((uint32_t)c << 24);
}

static int run(Proto *p) {
  Instruction *pc = p->code;
  int regs[8] = {0};
  int steps = 0;

  while (1) {
    if (steps++ > 100) return -1;
    Instruction i = *pc++;  /* read instruction, advance pc by 1 (sizeof(Instruction)=4 bytes) */
    uint8_t op = (uint8_t)(i & 0xFF);
    uint8_t a  = (uint8_t)((i >> 8) & 0xFF);
    uint8_t b  = (uint8_t)((i >> 16) & 0xFF);
    uint8_t c  = (uint8_t)((i >> 24) & 0xFF);

    switch (op) {
      case OP_LOADI:
        regs[a] = (int)b;
        break;
      case OP_ADD:
        regs[a] = regs[b] + regs[c];
        break;
      case OP_PRINT:
        printf("r%d=%d\n", a, regs[a]);
        break;
      case OP_HALT:
        return steps;
      default:
        return -2;
    }
  }
}

int main(void) {
  Proto p;
  p.sizecode = 5;
  p.code = (Instruction *)malloc(p.sizecode * sizeof(Instruction));
  p.code[0] = enc(OP_LOADI, 0, 10, 0);
  p.code[1] = enc(OP_LOADI, 1, 32, 0);
  p.code[2] = enc(OP_ADD, 2, 0, 1);
  p.code[3] = enc(OP_PRINT, 2, 0, 0);
  p.code[4] = enc(OP_HALT, 0, 0, 0);

  int rc = run(&p);
  printf("rc=%d\n", rc);
  free(p.code);
  return 0;
}
