export class FixtureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixtureValidationError";
  }
}
