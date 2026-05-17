export interface ProcessResult {
  content: string;
  redirect?: string;
}

export interface TemplateProcessor {
  process(content: string, data: Record<string, unknown>, phase: "pre-layout" | "post-layout"): ProcessResult;
}
