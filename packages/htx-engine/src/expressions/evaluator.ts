import type {
  AstNode,
  EachNode,
  ExpressionNode,
  FunctionCallNode,
  IfNode,
  TemplateChildNode,
  TemplateNode,
} from "./ast";
import { ExpressionLimitError } from "./errors";
import { FunctionRegistry } from "./function-registry";

const MAX_LOOP_ITERATIONS = 1000;
const MAX_NESTING_DEPTH = 10;
const MAX_FUNCTION_CALL_DEPTH = 5;
const MAX_OUTPUT_SIZE = 1_048_576;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class Evaluator {
  private readonly functionRegistry: FunctionRegistry;
  private scopeStack: Array<Record<string, unknown>> = [];
  private loopIterations = 0;
  private nestingDepth = 0;
  private functionCallDepth = 0;
  private outputSize = 0;
  private rawMode = false;

  constructor(functionRegistry: FunctionRegistry) {
    this.functionRegistry = functionRegistry;
  }

  evaluate(ast: TemplateNode, data: Record<string, unknown>, rawMode = false): string {
    this.scopeStack = [data];
    this.loopIterations = 0;
    this.nestingDepth = 0;
    this.functionCallDepth = 0;
    this.outputSize = 0;
    this.rawMode = rawMode;

    return this.renderNode(ast);
  }

  resolveCondition(
    condition: ExpressionNode,
    data: Record<string, unknown>,
  ): boolean {
    this.scopeStack = [data];
    return this.isTruthy(this.resolveValue(condition));
  }

  private renderNode(node: TemplateNode | TemplateChildNode): string {
    switch (node.kind) {
      case "template": {
        return node.children.map((child) => this.renderNode(child)).join("");
      }
      case "text": {
        this.trackOutput(node.text.length);
        return node.text;
      }
      case "output": {
        const value = this.resolveValue(node.expression);
        const rendered = this.rawMode
          ? String(value ?? "")
          : escapeHtml(String(value ?? ""));
        this.trackOutput(rendered.length);
        return rendered;
      }
      case "raw_output": {
        const rendered = String(this.resolveValue(node.expression) ?? "");
        this.trackOutput(rendered.length);
        return rendered;
      }
      case "if":
        return this.evaluateIf(node);
      case "each":
        return this.evaluateEach(node);
    }
  }

  private evaluateIf(node: IfNode): string {
    this.nestingDepth += 1;
    if (this.nestingDepth > MAX_NESTING_DEPTH) {
      throw new ExpressionLimitError(`Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded`);
    }

    let output = "";

    if (this.isTruthy(this.resolveValue(node.condition))) {
      output = node.body.map((child) => this.renderNode(child)).join("");
    } else {
      let matched = false;
      for (const clause of node.elseifClauses) {
        if (this.isTruthy(this.resolveValue(clause.condition))) {
          output = clause.body.map((child) => this.renderNode(child)).join("");
          matched = true;
          break;
        }
      }

      if (!matched && node.elseBody) {
        output = node.elseBody.map((child) => this.renderNode(child)).join("");
      }
    }

    this.nestingDepth -= 1;
    return output;
  }

  private evaluateEach(node: EachNode): string {
    this.nestingDepth += 1;
    if (this.nestingDepth > MAX_NESTING_DEPTH) {
      throw new ExpressionLimitError(`Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded`);
    }

    const iterableValue = this.resolveValue(node.iterable);
    const iterable = Array.isArray(iterableValue)
      ? iterableValue
      : iterableValue === null || iterableValue === ""
        ? []
        : [iterableValue];

    let output = "";
    const total = iterable.length;

    iterable.forEach((element, index) => {
      if (this.loopIterations >= MAX_LOOP_ITERATIONS) {
        throw new ExpressionLimitError(
          `Maximum loop iterations of ${MAX_LOOP_ITERATIONS} exceeded`,
        );
      }

      this.scopeStack.push({
        [node.variableName]: element,
        loop: {
          index,
          count: index + 1,
          first: index === 0,
          last: index === total - 1,
        },
      });

      let iterationOutput = node.body.map((child) => this.renderNode(child)).join("");
      if (node.key) {
        const keyValue = escapeHtml(String(this.resolveValue(node.key) ?? ""));
        iterationOutput = this.injectKeyAttribute(iterationOutput, keyValue);
      }

      output += iterationOutput;
      this.scopeStack.pop();
      this.loopIterations += 1;
    });

    this.nestingDepth -= 1;
    return output;
  }

  private injectKeyAttribute(html: string, keyValue: string): string {
    return html.replace(/^(\s*<\w+)/, `$1 data-htx-key="${keyValue}"`);
  }

  private resolveValue(node: ExpressionNode): unknown {
    switch (node.kind) {
      case "string_literal":
      case "number_literal":
      case "boolean_literal":
        return node.value;
      case "null_literal":
        return null;
      case "field_ref":
        return this.lookup(node.name);
      case "dot_access": {
        let current: unknown = this.lookup(node.object);
        for (const property of node.properties) {
          if (current && typeof current === "object" && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[property] ?? null;
          } else if (Array.isArray(current)) {
            current = current[property as unknown as number] ?? null;
          } else {
            return null;
          }
        }
        return current;
      }
      case "function_call":
        return this.evaluateFunction(node);
      case "ternary_op":
        return this.isTruthy(this.resolveValue(node.condition))
          ? this.resolveValue(node.trueBranch)
          : this.resolveValue(node.falseBranch);
      case "binary_op":
        return this.evaluateBinaryOp(node);
      case "unary_op":
        return !this.isTruthy(this.resolveValue(node.operand));
    }
  }

  private evaluateFunction(node: FunctionCallNode): unknown {
    this.functionCallDepth += 1;
    if (this.functionCallDepth > MAX_FUNCTION_CALL_DEPTH) {
      throw new ExpressionLimitError(
        `Maximum function call depth of ${MAX_FUNCTION_CALL_DEPTH} exceeded`,
      );
    }

    const args = node.arguments.map((argument) => this.resolveValue(argument));
    const result = this.functionRegistry.call(node.name, args);
    this.functionCallDepth -= 1;
    return result;
  }

  private evaluateBinaryOp(node: Extract<ExpressionNode, { kind: "binary_op" }>): unknown {
    if (node.operator === "and") {
      const left = this.resolveValue(node.left);
      if (!this.isTruthy(left)) {
        return false;
      }
      return this.isTruthy(this.resolveValue(node.right));
    }

    if (node.operator === "or") {
      const left = this.resolveValue(node.left);
      if (this.isTruthy(left)) {
        return true;
      }
      return this.isTruthy(this.resolveValue(node.right));
    }

    const left = this.resolveValue(node.left);
    const right = this.resolveValue(node.right);

    switch (node.operator) {
      case "==":
        return String(left) === String(right);
      case "!=":
        return String(left) !== String(right);
      case ">":
        return this.numericCompare(left, right, (a, b) => a > b);
      case "<":
        return this.numericCompare(left, right, (a, b) => a < b);
      case ">=":
        return this.numericCompare(left, right, (a, b) => a >= b);
      case "<=":
        return this.numericCompare(left, right, (a, b) => a <= b);
      default:
        return null;
    }
  }

  private numericCompare(
    left: unknown,
    right: unknown,
    compare: (left: number | string, right: number | string) => boolean,
  ): boolean {
    if (this.isNumeric(left) && this.isNumeric(right)) {
      return compare(Number(left), Number(right));
    }
    return compare(String(left), String(right));
  }

  private isNumeric(value: unknown): value is number | string {
    if (typeof value === "number") {
      return Number.isFinite(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
      return !Number.isNaN(Number(value));
    }

    return false;
  }

  private lookup(name: string): unknown {
    for (let index = this.scopeStack.length - 1; index >= 0; index -= 1) {
      if (Object.prototype.hasOwnProperty.call(this.scopeStack[index], name)) {
        return this.scopeStack[index][name];
      }
    }
    return null;
  }

  private isTruthy(value: unknown): boolean {
    if (
      value === null ||
      value === "" ||
      value === "0" ||
      value === "false" ||
      value === false ||
      value === 0 ||
      value === 0.0
    ) {
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    return true;
  }

  private trackOutput(bytes: number): void {
    this.outputSize += bytes;
    if (this.outputSize > MAX_OUTPUT_SIZE) {
      throw new ExpressionLimitError(
        `Output size exceeds maximum of ${MAX_OUTPUT_SIZE} bytes`,
      );
    }
  }
}
