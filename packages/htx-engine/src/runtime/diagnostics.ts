export interface HtxDiagnosticDetails {
  code: string;
  stage?: string;
  requestPath?: string;
  templatePath?: string;
  sourcePath?: string;
  blockAction?: string;
  contentType?: string;
  itemIndex?: number;
  relatedPaths?: string[];
}

function appendUnique(values: string[], next: string | undefined): void {
  if (!next || values.includes(next)) {
    return;
  }

  values.push(next);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class HtxDiagnosticError extends Error {
  readonly details: HtxDiagnosticDetails;
  readonly cause: unknown;

  constructor(message: string, details: HtxDiagnosticDetails, cause: unknown = null) {
    super(message);
    this.name = "HtxDiagnosticError";
    this.details = details;
    this.cause = cause;
  }

  withDetails(details: Partial<HtxDiagnosticDetails>): HtxDiagnosticError {
    return new HtxDiagnosticError(
      this.message,
      {
        ...details,
        ...this.details,
        relatedPaths: details.relatedPaths ?? this.details.relatedPaths,
      },
      this.cause,
    );
  }
}

export function toDiagnosticError(
  error: unknown,
  details: HtxDiagnosticDetails,
): HtxDiagnosticError {
  if (error instanceof HtxDiagnosticError) {
    return error.withDetails(details);
  }

  const message = error instanceof Error ? error.message : String(error);
  return new HtxDiagnosticError(message, details, error);
}

export function formatDiagnosticLog(error: unknown): string {
  const diagnostic =
    error instanceof HtxDiagnosticError
      ? error
      : toDiagnosticError(error, { code: "HTX_RUNTIME_ERROR" });
  const lines = [`[HTX] ${diagnostic.details.code}: ${diagnostic.message}`];

  appendUnique(lines, diagnostic.details.stage ? `Stage: ${diagnostic.details.stage}` : undefined);
  appendUnique(lines, diagnostic.details.requestPath ? `Request: ${diagnostic.details.requestPath}` : undefined);
  appendUnique(lines, diagnostic.details.templatePath ? `Template: ${diagnostic.details.templatePath}` : undefined);
  appendUnique(lines, diagnostic.details.sourcePath ? `Source: ${diagnostic.details.sourcePath}` : undefined);
  appendUnique(lines, diagnostic.details.contentType ? `Type: ${diagnostic.details.contentType}` : undefined);
  appendUnique(lines, diagnostic.details.blockAction ? `Action: ${diagnostic.details.blockAction}` : undefined);
  appendUnique(
    lines,
    diagnostic.details.itemIndex !== undefined ? `Row index: ${diagnostic.details.itemIndex}` : undefined,
  );

  for (const relatedPath of diagnostic.details.relatedPaths ?? []) {
    appendUnique(lines, `Related: ${relatedPath}`);
  }

  return lines.join("\n");
}

export function renderDiagnosticPage(error: unknown): string {
  const diagnostic =
    error instanceof HtxDiagnosticError
      ? error
      : toDiagnosticError(error, { code: "HTX_RUNTIME_ERROR" });
  const rows: Array<[string, string | number | undefined]> = [
    ["Code", diagnostic.details.code],
    ["Stage", diagnostic.details.stage],
    ["Request", diagnostic.details.requestPath],
    ["Template", diagnostic.details.templatePath],
    ["Source", diagnostic.details.sourcePath],
    ["Type", diagnostic.details.contentType],
    ["Action", diagnostic.details.blockAction],
    ["Row index", diagnostic.details.itemIndex],
  ];

  const detailsHtml = rows
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td><code>${escapeHtml(String(value))}</code></td></tr>`,
    )
    .join("");
  const relatedHtml = (diagnostic.details.relatedPaths ?? [])
    .map((filePath) => `<li><code>${escapeHtml(filePath)}</code></li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTX Runtime Error</title>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
    main { max-width: 960px; margin: 0 auto; padding: 2rem; }
    .panel { background: #111827; border: 1px solid #334155; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    h1, h2 { margin-top: 0; }
    p { color: #cbd5e1; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.65rem 0; border-top: 1px solid #1e293b; vertical-align: top; }
    th { width: 180px; color: #93c5fd; font-weight: 600; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
    .message { font-size: 1.05rem; color: #f8fafc; }
    .hint { color: #94a3b8; font-size: 0.95rem; }
    ul { margin: 0; padding-left: 1.25rem; }
  </style>
</head>
<body>
  <main>
    <section class="panel">
      <h1>HTX runtime error</h1>
      <p class="message">${escapeHtml(diagnostic.message)}</p>
      <p class="hint">The runtime is in development diagnostics mode, so detailed context is shown below.</p>
    </section>
    <section class="panel">
      <h2>Context</h2>
      <table>${detailsHtml || "<tr><td>No additional context.</td></tr>"}</table>
    </section>
    ${
      relatedHtml
        ? `<section class="panel"><h2>Related Files</h2><ul>${relatedHtml}</ul></section>`
        : ""
    }
  </main>
</body>
</html>`;
}

export function renderInlineDiagnostic(error: unknown): string {
  const diagnostic =
    error instanceof HtxDiagnosticError
      ? error
      : toDiagnosticError(error, { code: "HTX_RUNTIME_ERROR" });

  return `<div style="margin:1rem 0;padding:1rem;border:1px solid #fecaca;border-radius:12px;background:#fff1f2;color:#881337;">
  <strong>HTX render error</strong>
  <div style="margin-top:0.35rem;">${escapeHtml(diagnostic.message)}</div>
  <div style="margin-top:0.35rem;font-family:ui-monospace,monospace;font-size:0.92rem;">${escapeHtml(
    `${diagnostic.details.code}${diagnostic.details.itemIndex !== undefined ? ` @ row ${diagnostic.details.itemIndex}` : ""}`,
  )}</div>
</div>`;
}
