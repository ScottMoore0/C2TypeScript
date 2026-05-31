/* C17 §6.7.2.1 ¶16 + §6.5.6 + §6.5.2.3: bytecode VM where pc is reached
 * via a UNION FIELD inside a struct, mirroring Lua 5.4's exact pattern:
 *   ci->u.l.savedpc
 * Where:
 *   typedef struct CallInfo { ... union { struct { ...; Instruction *savedpc; } l; ... } u; ... } CallInfo;
 *
 * This is the most-stressed pattern in Lua's VM init.
 *
 * EXPECT: translated TS produces identical output to gcc.
 */
#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

enum { OP_LOADI = 1, OP_ADD = 2, OP_PRINT = 3, OP_HALT = 4 };

typedef uint32_t Instruction;

typedef struct CallInfo {
  int dummy;
  union {
    struct {
      Instruction *savedpc;
      int trap;
    } l;
    struct {
      int n;
    } c;
  } u;
} CallInfo;

static uint32_t enc(uint8_t op, uint8_t a, uint8_t b, uint8_t c) {
  return ((uint32_t)op) | ((uint32_t)a << 8) | ((uint32_t)b << 16) | ((uint32_t)c << 24);
}

static int run(CallInfo *ci) {
  /* Lua's pattern: pc = ci->u.l.savedpc */
  Instruction *pc = ci->u.l.savedpc;
  int regs[8] = {0};
  int steps = 0;

  while (1) {
    if (steps++ > 100) return -1;
    Instruction i = *pc++;
    uint8_t op = (uint8_t)(i & 0xFF);
    uint8_t a  = (uint8_t)((i >> 8) & 0xFF);
    uint8_t b  = (uint8_t)((i >> 16) & 0xFF);
    uint8_t c  = (uint8_t)((i >> 24) & 0xFF);

    switch (op) {
      case OP_LOADI: regs[a] = (int)b; break;
      case OP_ADD:   regs[a] = regs[b] + regs[c]; break;
      case OP_PRINT: printf("r%d=%d\n", a, regs[a]); break;
      case OP_HALT:  return steps;
      default:       return -2;
    }
  }
}

int main(void) {
  CallInfo ci;
  Instruction code[5];
  code[0] = enc(OP_LOADI, 0, 10, 0);
  code[1] = enc(OP_LOADI, 1, 32, 0);
  code[2] = enc(OP_ADD, 2, 0, 1);
  code[3] = enc(OP_PRINT, 2, 0, 0);
  code[4] = enc(OP_HALT, 0, 0, 0);
  ci.u.l.savedpc = code;
  ci.u.l.trap = 0;

  int rc = run(&ci);
  printf("rc=%d\n", rc);
  return 0;
}
