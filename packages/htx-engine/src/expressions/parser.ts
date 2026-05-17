import type {
  EachNode,
  ExpressionNode,
  IfNode,
  TemplateChildNode,
  TemplateNode,
} from "./ast";
import { ExpressionParseError } from "./errors";
import { FunctionRegistry } from "./function-registry";
import type { Segment, Token } from "./token";

const MAX_NESTING_DEPTH = 10;

export class Parser {
  private readonly functionRegistry: FunctionRegistry;
  private nestingDepth = 0;
  private tokens: Token[] = [];
  private tokenPosition = 0;

  constructor(functionRegistry: FunctionRegistry) {
    this.functionRegistry = functionRegistry;
  }

  parse(segments: Segment[]): TemplateNode {
    this.nestingDepth = 0;
    let position = 0;
    return {
      kind: "template",
      children: this.parseBody(segments, () => position, (value) => {
        position = value;
      }, null),
    };
  }

  parseExpression(expression: string): ExpressionNode {
    this.tokens = this.tokenizeExpression(expression);
    this.tokenPosition = 0;

    if (this.tokens.length === 0) {
      throw new ExpressionParseError("Empty expression");
    }

    const node = this.parsePipeExpression();
    if (this.tokenPosition < this.tokens.length) {
      throw new ExpressionParseError(
        `Unexpected token: ${this.tokens[this.tokenPosition]?.value ?? "?"}`,
      );
    }

    return node;
  }

  private parseBody(
    segments: Segment[],
    getPosition: () => number,
    setPosition: (value: number) => void,
    stopAt: "endif" | "endeach" | null,
  ): TemplateChildNode[] {
    const nodes: TemplateChildNode[] = [];

    while (getPosition() < segments.length) {
      const segment = segments[getPosition()];

      if (segment.type === "text") {
        nodes.push({ kind: "text", text: segment.content });
        setPosition(getPosition() + 1);
        continue;
      }

      if (segment.type === "expression") {
        nodes.push({ kind: "output", expression: this.parseExpression(segment.content) });
        setPosition(getPosition() + 1);
        continue;
      }

      if (segment.type === "raw_expression") {
        nodes.push({ kind: "raw_output", expression: this.parseExpression(segment.content) });
        setPosition(getPosition() + 1);
        continue;
      }

      if (segment.type === "block_close") {
        if (stopAt && segment.keyword === stopAt) {
          return nodes;
        }

        throw new ExpressionParseError(
          `Unexpected closing tag: ${segment.keyword}${stopAt ? ` (expected ${stopAt})` : ""}`,
        );
      }

      if (segment.keyword === "elif" || segment.keyword === "else") {
        if (stopAt) {
          return nodes;
        }

        throw new ExpressionParseError(`Unexpected ${segment.keyword} without matching if`);
      }

      if (segment.keyword === "if") {
        nodes.push(this.parseIf(segments, getPosition, setPosition));
        continue;
      }

      if (segment.keyword === "each") {
        nodes.push(this.parseEach(segments, getPosition, setPosition));
        continue;
      }

      throw new ExpressionParseError(`Unknown block keyword: ${segment.keyword}`);
    }

    if (stopAt) {
      throw new ExpressionParseError(`Unclosed block — expected ${stopAt}`);
    }

    return nodes;
  }

  private parseIf(
    segments: Segment[],
    getPosition: () => number,
    setPosition: (value: number) => void,
  ): IfNode {
    this.nestingDepth += 1;
    if (this.nestingDepth > MAX_NESTING_DEPTH) {
      throw new ExpressionParseError(`Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded`);
    }

    const current = segments[getPosition()];
    if (current.type !== "block_open" || current.keyword !== "if") {
      throw new ExpressionParseError("Expected if block");
    }

    const condition = this.parseExpression(current.content);
    setPosition(getPosition() + 1);

    const body = this.parseBody(segments, getPosition, setPosition, "endif");
    const elseifClauses: IfNode["elseifClauses"] = [];
    let elseBody: TemplateChildNode[] | null = null;

    while (getPosition() < segments.length) {
      const segment = segments[getPosition()];

      if (segment.type === "block_close" && segment.keyword === "endif") {
        setPosition(getPosition() + 1);
        break;
      }

      if (segment.type === "block_open" && segment.keyword === "elif") {
        const elifCondition = this.parseExpression(segment.content);
        setPosition(getPosition() + 1);
        const elifBody = this.parseBody(segments, getPosition, setPosition, "endif");
        elseifClauses.push({ condition: elifCondition, body: elifBody });
        continue;
      }

      if (segment.type === "block_open" && segment.keyword === "else") {
        setPosition(getPosition() + 1);
        elseBody = this.parseBody(segments, getPosition, setPosition, "endif");
        const closing = segments[getPosition()];
        if (closing?.type === "block_close" && closing.keyword === "endif") {
          setPosition(getPosition() + 1);
        }
        break;
      }

      throw new ExpressionParseError("Unexpected segment in if block");
    }

    this.nestingDepth -= 1;
    return { kind: "if", condition, body, elseifClauses, elseBody };
  }

  private parseEach(
    segments: Segment[],
    getPosition: () => number,
    setPosition: (value: number) => void,
  ): EachNode {
    this.nestingDepth += 1;
    if (this.nestingDepth > MAX_NESTING_DEPTH) {
      throw new ExpressionParseError(`Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded`);
    }

    const current = segments[getPosition()];
    if (current.type !== "block_open" || current.keyword !== "each") {
      throw new ExpressionParseError("Expected each block");
    }

    setPosition(getPosition() + 1);
    const match = current.content.match(/^(\w+)\s+in\s+(.+)$/s);
    if (!match) {
      throw new ExpressionParseError("Invalid each syntax: expected 'variable in expression'");
    }

    const variableName = match[1];
    let iterableSource = match[2].trim();
    let key: ExpressionNode | null = null;

    const keyMatch = iterableSource.match(/^(.+?)\s+key\s+(.+)$/s);
    if (keyMatch) {
      iterableSource = keyMatch[1].trim();
      key = this.parseExpression(keyMatch[2].trim());
    }

    const iterable = this.parseExpression(iterableSource);
    const body = this.parseBody(segments, getPosition, setPosition, "endeach");
    const closing = segments[getPosition()];
    if (closing?.type === "block_close" && closing.keyword === "endeach") {
      setPosition(getPosition() + 1);
    }

    this.nestingDepth -= 1;
    return { kind: "each", variableName, iterable, body, key };
  }

  private parsePipeExpression(): ExpressionNode {
    let expression = this.parseTernaryExpression();

    while (this.matchToken("pipe", "|")) {
      const token = this.currentToken();
      if (!token || token.type !== "identifier") {
        throw new ExpressionParseError("Expected filter name after '|'");
      }

      const filterName = token.value;
      this.tokenPosition += 1;

      if (!this.functionRegistry.has(filterName)) {
        throw new ExpressionParseError(`Unknown function: ${filterName}`);
      }

      const args: ExpressionNode[] = [expression];
      if (this.matchToken("colon", ":")) {
        args.push(this.parsePrimary());
      }

      expression = {
        kind: "function_call",
        name: filterName,
        arguments: args,
      };
    }

    return expression;
  }

  private parseTernaryExpression(): ExpressionNode {
    const condition = this.parseOrExpression();
    if (!this.matchToken("question", "?")) {
      return condition;
    }

    const trueBranch = this.parseTernaryExpression();
    this.expectToken("colon", ":");
    const falseBranch = this.parseTernaryExpression();

    return { kind: "ternary_op", condition, trueBranch, falseBranch };
  }

  private parseOrExpression(): ExpressionNode {
    let left = this.parseAndExpression();
    while (this.matchKeyword("or")) {
      const right = this.parseAndExpression();
      left = { kind: "binary_op", operator: "or", left, right };
    }
    return left;
  }

  private parseAndExpression(): ExpressionNode {
    let left = this.parseComparison();
    while (this.matchKeyword("and")) {
      const right = this.parseComparison();
      left = { kind: "binary_op", operator: "and", left, right };
    }
    return left;
  }

  private parseComparison(): ExpressionNode {
    const left = this.parseUnary();
    for (const operator of ["==", "!=", ">=", "<=", ">", "<"] as const) {
      if (this.matchOperator(operator)) {
        const right = this.parseUnary();
        return { kind: "binary_op", operator, left, right };
      }
    }
    return left;
  }

  private parseUnary(): ExpressionNode {
    if (this.matchKeyword("not")) {
      return { kind: "unary_op", operator: "not", operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.currentToken();
    if (!token) {
      throw new ExpressionParseError("Unexpected end of expression");
    }

    if (token.type === "paren" && token.value === "(") {
      this.tokenPosition += 1;
      const node = this.parseTernaryExpression();
      this.expectToken("paren", ")");
      return node;
    }

    if (token.type === "string") {
      this.tokenPosition += 1;
      return { kind: "string_literal", value: token.value };
    }

    if (token.type === "number") {
      this.tokenPosition += 1;
      return { kind: "number_literal", value: Number(token.value) };
    }

    if (token.type === "keyword" && (token.value === "true" || token.value === "false")) {
      this.tokenPosition += 1;
      return { kind: "boolean_literal", value: token.value === "true" };
    }

    if (token.type === "keyword" && token.value === "null") {
      this.tokenPosition += 1;
      return { kind: "null_literal" };
    }

    if (token.type === "identifier") {
      const name = token.value;
      this.tokenPosition += 1;
      const next = this.currentToken();

      if (next?.type === "paren" && next.value === "(") {
        return this.parseFunctionCall(name);
      }

      if (next?.type === "dot") {
        const properties: string[] = [];

        while (this.currentToken()?.type === "dot") {
          this.tokenPosition += 1;
          const propertyToken = this.currentToken();
          if (!propertyToken || propertyToken.type !== "identifier") {
            throw new ExpressionParseError("Expected property name after '.'");
          }
          properties.push(propertyToken.value);
          this.tokenPosition += 1;
        }

        return { kind: "dot_access", object: name, properties };
      }

      return { kind: "field_ref", name };
    }

    throw new ExpressionParseError(`Unexpected token: ${token.value}`);
  }

  private parseFunctionCall(name: string): ExpressionNode {
    if (!this.functionRegistry.has(name)) {
      throw new ExpressionParseError(`Unknown function: ${name}`);
    }

    this.tokenPosition += 1;
    const args: ExpressionNode[] = [];
    let first = true;

    while (true) {
      const token = this.currentToken();
      if (token?.type === "paren" && token.value === ")") {
        this.tokenPosition += 1;
        break;
      }

      if (!first) {
        this.expectToken("comma", ",");
      }
      first = false;
      args.push(this.parseTernaryExpression());
    }

    return { kind: "function_call", name, arguments: args };
  }

  private currentToken(): Token | undefined {
    return this.tokens[this.tokenPosition];
  }

  private matchKeyword(keyword: string): boolean {
    const token = this.currentToken();
    if (token?.type === "keyword" && token.value === keyword) {
      this.tokenPosition += 1;
      return true;
    }
    return false;
  }

  private matchOperator(operator: string): boolean {
    const token = this.currentToken();
    if (token?.type === "operator" && token.value === operator) {
      this.tokenPosition += 1;
      return true;
    }
    return false;
  }

  private matchToken(type: Token["type"], value: string): boolean {
    const token = this.currentToken();
    if (token?.type === type && token.value === value) {
      this.tokenPosition += 1;
      return true;
    }
    return false;
  }

  private expectToken(type: Token["type"], value: string): void {
    const token = this.currentToken();
    if (!token || token.type !== type || token.value !== value) {
      throw new ExpressionParseError(
        `Expected '${value}', got '${token ? token.value : "end of expression"}'`,
      );
    }
    this.tokenPosition += 1;
  }

  private tokenizeExpression(expression: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < expression.length) {
      const char = expression[position];

      if (/\s/.test(char)) {
        position += 1;
        continue;
      }

      if (char === '"' || char === "'") {
        const quote = char;
        const start = position;
        position += 1;
        let value = "";

        while (position < expression.length && expression[position] !== quote) {
          if (expression[position] === "\\" && position + 1 < expression.length) {
            value += expression[position + 1];
            position += 2;
            continue;
          }
          value += expression[position];
          position += 1;
        }

        if (position >= expression.length) {
          throw new ExpressionParseError("Unterminated string literal");
        }

        position += 1;
        tokens.push({ type: "string", value, position: start });
        continue;
      }

      const twoCharacterOperator = expression.slice(position, position + 2);
      if (["==", "!=", ">=", "<="].includes(twoCharacterOperator)) {
        tokens.push({ type: "operator", value: twoCharacterOperator, position });
        position += 2;
        continue;
      }

      if (char === ">" || char === "<") {
        tokens.push({ type: "operator", value: char, position });
        position += 1;
        continue;
      }

      if (char === "(" || char === ")") {
        tokens.push({ type: "paren", value: char, position });
        position += 1;
        continue;
      }

      if (char === "|") {
        tokens.push({ type: "pipe", value: char, position });
        position += 1;
        continue;
      }

      if (char === ":") {
        tokens.push({ type: "colon", value: char, position });
        position += 1;
        continue;
      }

      if (char === ",") {
        tokens.push({ type: "comma", value: char, position });
        position += 1;
        continue;
      }

      if (char === "?") {
        tokens.push({ type: "question", value: char, position });
        position += 1;
        continue;
      }

      if (char === ".") {
        tokens.push({ type: "dot", value: char, position });
        position += 1;
        continue;
      }

      if (/\d/.test(char)) {
        const start = position;
        while (position < expression.length && /\d/.test(expression[position])) {
          position += 1;
        }
        if (expression[position] === "." && /\d/.test(expression[position + 1] ?? "")) {
          position += 1;
          while (position < expression.length && /\d/.test(expression[position])) {
            position += 1;
          }
        }
        tokens.push({ type: "number", value: expression.slice(start, position), position: start });
        continue;
      }

      if (/[A-Za-z_$]/.test(char)) {
        const start = position;
        if (char === "$") {
          position += 1;
        }
        while (position < expression.length && /[A-Za-z0-9_]/.test(expression[position])) {
          position += 1;
        }
        const word = expression.slice(start, position);
        if (["and", "or", "not", "true", "false", "null"].includes(word)) {
          tokens.push({ type: "keyword", value: word, position: start });
        } else {
          tokens.push({ type: "identifier", value: word, position: start });
        }
        continue;
      }

      throw new ExpressionParseError(`Unexpected character: ${char}`);
    }

    return tokens;
  }
}
