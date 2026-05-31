export class AnchorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnchorError";
  }
}

export class SourceMapError extends AnchorError {
  constructor(message: string) {
    super(message);
    this.name = "SourceMapError";
  }
}
