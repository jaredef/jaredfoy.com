export interface Token {
  type:
    | "string"
    | "number"
    | "identifier"
    | "keyword"
    | "operator"
    | "paren"
    | "pipe"
    | "colon"
    | "comma"
    | "question"
    | "dot";
  value: string;
  position: number;
}

export type Segment =
  | { type: "text"; content: string }
  | { type: "expression"; content: string }
  | { type: "raw_expression"; content: string }
  | { type: "block_open"; keyword: "if" | "elif" | "else" | "each"; content: string }
  | { type: "block_close"; keyword: "endif" | "endeach" };
