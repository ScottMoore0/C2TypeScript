/**
 * Shared output writer for all language emitters.
 * Handles indentation, line accumulation, and output generation.
 */

export class EmitWriter {
  private output: string[] = [];
  private indentLevel = 0;

  constructor(private indentStr: string = "  ") {}

  writeLine(line: string): void {
    this.output.push(this.indentStr.repeat(this.indentLevel) + line);
  }

  writeRaw(text: string): void {
    this.output.push(text);
  }

  indent(): void { this.indentLevel++; }
  dedent(): void { this.indentLevel--; }

  getIndentLevel(): number { return this.indentLevel; }
  setIndentLevel(level: number): void { this.indentLevel = level; }

  getOutput(): string { return this.output.join("\n") + "\n"; }
  getLines(): string[] { return [...this.output]; }

  reset(): void {
    this.output = [];
    this.indentLevel = 0;
  }
}
