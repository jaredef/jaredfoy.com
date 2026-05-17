export interface ParsedResponseBlock {
  name: string;
  template: string;
}

export interface ParsedNestBlock {
  meta: Record<string, string | number>;
  template: string;
  responses?: ParsedResponseBlock[];
  nests?: ParsedNestBlock[];
}

export interface ParsedBlock {
  meta: Record<string, string | number>;
  template: string;
  responses: ParsedResponseBlock[];
  nests: ParsedNestBlock[];
  startPos: number;
  endPos: number;
  regionStart?: number;
}

export interface ParsedTemplate {
  blocks: ParsedBlock[];
}
