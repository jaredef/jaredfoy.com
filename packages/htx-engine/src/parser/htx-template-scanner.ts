export interface HtxTemplateRange {
  attributes: string;
  content: string;
  endPos: number;
  fullMatch: string;
  startPos: number;
}

const HTX_TEMPLATE_TAG_PATTERN = /<\/?htx(?:\s+[^>]*)?>/g;

export function scanTopLevelHtxTemplates(input: string): HtxTemplateRange[] {
  const ranges: HtxTemplateRange[] = [];
  const stack: Array<{ attributes: string; openEndPos: number; startPos: number }> = [];

  for (const match of input.matchAll(HTX_TEMPLATE_TAG_PATTERN)) {
    const tag = match[0];
    const startPos = match.index ?? 0;
    const endPos = startPos + tag.length;

    if (tag.startsWith("</")) {
      const open = stack.pop();
      if (!open) {
        continue;
      }

      if (stack.length === 0) {
        ranges.push({
          attributes: open.attributes,
          content: input.slice(open.openEndPos, startPos).trim(),
          endPos,
          fullMatch: input.slice(open.startPos, endPos),
          startPos: open.startPos,
        });
      }

      continue;
    }

    stack.push({
      attributes: tag.slice("<htx".length, -1).trim(),
      openEndPos: endPos,
      startPos,
    });
  }

  return ranges;
}

export function stripTopLevelHtxTemplates(
  input: string,
  ranges: HtxTemplateRange[] = scanTopLevelHtxTemplates(input),
): string {
  let stripped = input;

  for (const range of [...ranges].reverse()) {
    stripped = stripped.slice(0, range.startPos) + stripped.slice(range.endPos);
  }

  return stripped;
}
