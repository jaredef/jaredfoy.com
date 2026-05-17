export interface TemplateNode {
  kind: "template";
  children: TemplateChildNode[];
}

export interface TextNode {
  kind: "text";
  text: string;
}

export interface OutputNode {
  kind: "output";
  expression: ExpressionNode;
}

export interface RawOutputNode {
  kind: "raw_output";
  expression: ExpressionNode;
}

export interface IfNode {
  kind: "if";
  condition: ExpressionNode;
  body: TemplateChildNode[];
  elseifClauses: Array<{ condition: ExpressionNode; body: TemplateChildNode[] }>;
  elseBody: TemplateChildNode[] | null;
}

export interface EachNode {
  kind: "each";
  variableName: string;
  iterable: ExpressionNode;
  body: TemplateChildNode[];
  key: ExpressionNode | null;
}

export interface FieldRefNode {
  kind: "field_ref";
  name: string;
}

export interface DotAccessNode {
  kind: "dot_access";
  object: string;
  properties: string[];
}

export interface StringLiteralNode {
  kind: "string_literal";
  value: string;
}

export interface NumberLiteralNode {
  kind: "number_literal";
  value: number;
}

export interface BooleanLiteralNode {
  kind: "boolean_literal";
  value: boolean;
}

export interface NullLiteralNode {
  kind: "null_literal";
}

export interface BinaryOpNode {
  kind: "binary_op";
  operator: "and" | "or" | "==" | "!=" | ">" | "<" | ">=" | "<=";
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryOpNode {
  kind: "unary_op";
  operator: "not";
  operand: ExpressionNode;
}

export interface FunctionCallNode {
  kind: "function_call";
  name: string;
  arguments: ExpressionNode[];
}

export interface TernaryOpNode {
  kind: "ternary_op";
  condition: ExpressionNode;
  trueBranch: ExpressionNode;
  falseBranch: ExpressionNode;
}

export type ExpressionNode =
  | FieldRefNode
  | DotAccessNode
  | StringLiteralNode
  | NumberLiteralNode
  | BooleanLiteralNode
  | NullLiteralNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionCallNode
  | TernaryOpNode;

export type TemplateChildNode =
  | TextNode
  | OutputNode
  | RawOutputNode
  | IfNode
  | EachNode;

export type AstNode = TemplateNode | TemplateChildNode | ExpressionNode;
