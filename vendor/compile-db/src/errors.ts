export class DossierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DossierError";
  }
}

export class CompileCommandError extends DossierError {
  constructor(message: string) {
    super(message);
    this.name = "CompileCommandError";
  }
}
