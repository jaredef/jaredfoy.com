import type { ParsedBlock } from "./types";
import { MetaExtractor } from "./meta-extractor";
import { NestTreeBuilder } from "./nest-tree-builder";
import { ResponseExtractor } from "./response-extractor";
import { TemplateExtractor } from "./template-extractor";
import { scanTopLevelHtxTemplates, stripTopLevelHtxTemplates } from "./htx-template-scanner";

export class DSLParser {
  private readonly metaExtractor = new MetaExtractor();
  private readonly responseExtractor = new ResponseExtractor();
  private readonly templateExtractor = new TemplateExtractor();
  private readonly nestTreeBuilder = new NestTreeBuilder();

  parse(dsl: string): {
    meta: Record<string, string | number>;
    responses: Record<string, string>;
    template: string;
    nests: ReturnType<NestTreeBuilder["build"]>["nests"];
  } {
    const ranges = scanTopLevelHtxTemplates(dsl);
    const rootDsl = stripTopLevelHtxTemplates(dsl, ranges);
    const meta = this.metaExtractor.extractFromRootDsl(rootDsl);
    const responses = this.responseExtractor.extractFromRootDsl(rootDsl);
    const template = this.templateExtractor.extractFromRanges(ranges);
    const nestResult = this.nestTreeBuilder.build(template);

    return {
      meta,
      responses,
      template: nestResult.template,
      nests: nestResult.nests,
    };
  }

  parseBlocks(dsl: string): ParsedBlock[] {
    const blocks = scanTopLevelHtxTemplates(dsl);

    if (blocks.length === 0) {
      return [];
    }

    return blocks.map((block, index) => {
      const searchStart = index > 0 ? blocks[index - 1].endPos : 0;
      const region = dsl.slice(searchStart, block.startPos);
      const trailingDirectiveMatch = region.match(
        /(?:\s*<htx:[a-zA-Z][\w-]*(?:\s+[^>]*)?>[\s\S]*?<\/htx:[a-zA-Z][\w-]*>\s*)+$/s,
      );
      const directiveRegion = trailingDirectiveMatch?.[0] ?? "";
      const regionStart = trailingDirectiveMatch
        ? block.startPos - directiveRegion.length
        : block.startPos;
      const nestResult = this.nestTreeBuilder.build(block.content);

      return {
        meta: this.metaExtractor.extractFromRegion(directiveRegion),
        responses: Object.entries(this.responseExtractor.extract(directiveRegion)).map(([name, template]) => ({
          name,
          template,
        })),
        template: nestResult.template,
        nests: nestResult.nests.map((nest) => ({
          meta: {
            source: nest.source ?? "",
            field: nest.field ?? "",
            type: nest.type ?? "",
            where: nest.where ?? "",
            order: nest.order ?? "",
            status: nest.status ?? "",
            onError: nest.onError,
            paginate: nest.paginate ?? "",
          },
          template: nest.innerTemplate,
          responses: [],
          nests: [],
        })),
        startPos: block.startPos,
        endPos: block.endPos,
        regionStart,
      };
    });
  }

  extractMeta(dsl: string): Record<string, string | number> {
    return this.metaExtractor.extract(dsl);
  }

  extractResponses(dsl: string): Record<string, string> {
    return this.responseExtractor.extract(dsl);
  }

  extractTemplate(dsl: string): string {
    return this.templateExtractor.extract(dsl);
  }
}
