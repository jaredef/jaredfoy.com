export class ExpressionParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionParseError";
  }
}

export class ExpressionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionLimitError";
  }
}
