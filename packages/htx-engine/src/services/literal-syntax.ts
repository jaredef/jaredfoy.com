const RAW_BLOCK_PATTERN = /<htx:raw(?:\s+[^>]*)?>([\s\S]*?)<\/htx:raw>/g;
const RAW_EXPRESSION_PATTERN = /(?<!\\)(\{\{[\s\S]*?\}\})/g;
const RAW_PLACEHOLDER_PATTERN =
  /(?<!\\)__([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)?)__/g;

export function protectRawBlocks(template: string): string {
  return template.replace(RAW_BLOCK_PATTERN, (_match, content) => {
    const escapedExpressions = content.replace(RAW_EXPRESSION_PATTERN, "\\$1");
    const escapedContent = escapedExpressions.replace(
      RAW_PLACEHOLDER_PATTERN,
      "\\__$1__",
    );

    return `<htx:raw>${escapedContent}</htx:raw>`;
  });
}

export function finalizeLiteralOutput(template: string): string {
  return template
    .replace(/<htx:raw(?:\s+[^>]*)?>/g, "")
    .replace(/<\/htx:raw>/g, "")
    .replace(/\\(\{\{)/g, "$1")
    .replace(/\\(\}\})/g, "$1")
    .replace(/\\(__)/g, "$1");
}
