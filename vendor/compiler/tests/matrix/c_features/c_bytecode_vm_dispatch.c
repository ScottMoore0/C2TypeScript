/* C17 §6.8.5 + §6.8.4.2 + §6.5.6 + §6.5.3.2: bytecode VM with wrapping
 * while(1) loop, switch dispatch, and pc-as-byte-pointer advancement.
 * Mirrors Lua 5.4's lvm.c luaV_execute pattern that's failing in our
 * Lua translation. Each iteration:
 *   1. Reads a 4-byte instruction from `*(uint32_t *)pc`
 *   2. Advances pc by 4
 *   3. Dispatches on the opcode
 *   4. Handler may read operands from the instruction
 *   5. HALT exits the loop
 *
 * This is the minimal interpreter loop that exercises:
 *   - pc as a `uint8_t *` cursor into a byte buffer
 *   - 4-byte-aligned reads via cast `*(uint32_t *)pc`
 *   - pc += 4 via pointer arithmetic
 *   - while(1) loop with switch + break-to-continue dispatch
 *   - early-exit via return from inside the switch case
 *
 * EXPECT: translated TS produces identical output to gcc.
 */
#include <stdio.h>
#include <stdint.h>

enum { OP_LOADI = 1, OP_ADD = 2, OP_PRINT = 3, OP_HALT = 4 };

/* Encode instruction: op:8 | a:8 | b:8 | c:8 (little-endian 4-byte word) */
static uint32_t enc(uint8_t op, uint8_t a, uint8_t b, uint8_t c) {
  return ((uint32_t)op) | ((uint32_t)a << 8) | ((uint32_t)b << 16) | ((uint32_t)c << 24);
}

static int run(uint8_t *bytecode) {
  uint8_t *pc = bytecode;
  int regs[8] = {0};
  int steps = 0;

  while (1) {
    if (steps++ > 100) return -1;  /* safety: infinite loop guard */
    uint32_t i = *(uint32_t *)pc;
    pc += 4;
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
        return -2;  /* unknown opcode */
    }
  }
}

int main(void) {
  /* Program:
   *   LOADI r0, 10
   *   LOADI r1, 32
   *   ADD r2, r0, r1   ; r2 = r0 + r1 = 42
   *   PRINT r2
   *   HALT
   */
  uint8_t code[20];
  *(uint32_t *)(code + 0)  = enc(OP_LOADI, 0, 10, 0);
  *(uint32_t *)(code + 4)  = enc(OP_LOADI, 1, 32, 0);
  *(uint32_t *)(code + 8)  = enc(OP_ADD, 2, 0, 1);
  *(uint32_t *)(code + 12) = enc(OP_PRINT, 2, 0, 0);
  *(uint32_t *)(code + 16) = enc(OP_HALT, 0, 0, 0);

  int rc = run(code);
  printf("rc=%d\n", rc);
  return 0;
}
