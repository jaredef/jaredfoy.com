import { ExpressionParseError } from "./errors";
import { registerArrayFunctions } from "./functions/array-functions";
import { registerDateFunctions } from "./functions/date-functions";
import { registerNumberFunctions } from "./functions/number-functions";
import { registerStringFunctions } from "./functions/string-functions";

export type ExpressionFunction = (...args: unknown[]) => unknown;

export class FunctionRegistry {
  private readonly functions = new Map<string, ExpressionFunction>();

  register(name: string, handler: ExpressionFunction): void {
    this.functions.set(name, handler);
  }

  has(name: string): boolean {
    return this.functions.has(name);
  }

  call(name: string, args: unknown[]): unknown {
    const handler = this.functions.get(name);
    if (!handler) {
      throw new ExpressionParseError(`Unknown function: ${name}`);
    }

    return handler(...args);
  }

  registerDefaults(): void {
    registerStringFunctions(this);
    registerDateFunctions(this);
    registerNumberFunctions(this);
    registerArrayFunctions(this);
  }
}
