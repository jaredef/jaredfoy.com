import { Evaluator } from "./evaluator";
import { FunctionRegistry } from "./function-registry";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { protectRawBlocks } from "../services/literal-syntax";

export class ExpressionEngine {
  private readonly lexer: Lexer;
  private readonly parser: Parser;
  private readonly functionRegistry: FunctionRegistry;

  constructor() {
    this.lexer = new Lexer();
    this.functionRegistry = new FunctionRegistry();
    this.functionRegistry.registerDefaults();
    this.parser = new Parser(this.functionRegistry);
  }

  getFunctionRegistry(): FunctionRegistry {
    return this.functionRegistry;
  }

  evaluate(template: string, data: Record<string, unknown>): string {
    const protectedTemplate = protectRawBlocks(template);
    const escaped = new Map<string, string>();
    const extracted = this.extractEscapedExpressions(protectedTemplate, escaped);
    const ast = this.parser.parse(this.lexer.tokenize(extracted));
    const result = this.createEvaluator().evaluate(ast, data);
    return this.restoreEscapedExpressions(result, escaped);
  }

  evaluateRaw(template: string, data: Record<string, unknown>): string {
    const protectedTemplate = protectRawBlocks(template);
    const escaped = new Map<string, string>();
    const extracted = this.extractEscapedExpressions(protectedTemplate, escaped);
    const ast = this.parser.parse(this.lexer.tokenize(extracted));
    const result = this.createEvaluator().evaluate(ast, data, true);
    return this.restoreEscapedExpressions(result, escaped);
  }

  hasExpressions(template: string): boolean {
    const protectedTemplate = protectRawBlocks(template);
    let index = 0;
    while ((index = protectedTemplate.indexOf("{{", index)) !== -1) {
      if (index === 0 || protectedTemplate[index - 1] !== "\\") {
        return true;
      }
      index += 2;
    }
    return false;
  }

  evaluateCondition(condition: string, data: Record<string, unknown>): boolean {
    return this.createEvaluator().resolveCondition(this.parser.parseExpression(condition), data);
  }

  private extractEscapedExpressions(template: string, escaped: Map<string, string>): string {
    return template.replace(/\\(\{\{.*?\}\})/gs, (match, expression) => {
      const marker = `<!--ESCAPED_EXPR_${escaped.size}-->`;
      escaped.set(marker, expression);
      return marker;
    });
  }

  private restoreEscapedExpressions(template: string, escaped: Map<string, string>): string {
    let output = template;
    for (const [marker, expression] of escaped.entries()) {
      output = output.replaceAll(marker, expression);
    }
    return output;
  }

  private createEvaluator(): Evaluator {
    return new Evaluator(this.functionRegistry);
  }
}
