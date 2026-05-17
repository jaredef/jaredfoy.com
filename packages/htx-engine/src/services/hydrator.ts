import { protectRawBlocks } from "./literal-syntax";

function escapeValue(value: unknown): string {
  const input =
    value !== null && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");

  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class Hydrator {
  private static readonly TRUSTED_HTML_FIELDS = new Set(["body_html"]);
  private static readonly ESCAPED_PLACEHOLDER_PATTERN =
    /\\__([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)__/g;
  private static readonly DOT_NOTATION_PATTERN =
    /__([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)__/g;
  private static readonly UNRESOLVED_PLACEHOLDER_PATTERN =
    /__([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)__/g;

  hydrate(template: string, data: Record<string, unknown>, scope?: Set<string>): string {
    let hydrated = protectRawBlocks(template);
    const escaped = new Map<string, string>();
    hydrated = this.extractEscapedPlaceholders(hydrated, escaped);

    const workingData = { ...data };
    if (hydrated.includes("__body__") && workingData.body_html !== undefined) {
      // Function-callback form of replaceAll: avoids JS's special-pattern
      // interpretation of $ characters in string replacements (e.g., $&, $',
      // $`, $1-$9, $$). With a string replacement, body_html containing $'
      // would substitute the portion of the template after the match, eating
      // page content. The function form returns the replacement verbatim.
      const bodyHtml = Hydrator.escapeTrustedHtml(String(workingData.body_html));
      hydrated = hydrated.replaceAll("__body__", () => bodyHtml);
      delete workingData.body;
      delete workingData.body_html;
    }

    for (const [key, value] of Object.entries(workingData)) {
      if (scope && !scope.has(key)) {
        continue;
      }
      const placeholder = `__${key}__`;
      // Same $-pattern hazard applies here; use function-callback form.
      const replacement = Hydrator.TRUSTED_HTML_FIELDS.has(key)
        ? Hydrator.escapeTrustedHtml(String(value ?? ""))
        : escapeValue(value);
      hydrated = hydrated.replaceAll(placeholder, () => replacement);
    }

    hydrated = hydrated.replace(
      Hydrator.DOT_NOTATION_PATTERN,
      (match, path) => {
        const parts = String(path).split(".");
        if (scope && !scope.has(parts[0])) {
          return match;
        }

        let current: unknown = workingData[parts[0]];
        for (let index = 1; index < parts.length; index += 1) {
          if (current && typeof current === "object" && !Array.isArray(current)) {
            current = (current as Record<string, unknown>)[parts[index]];
          } else {
            return match;
          }
        }

        return current !== undefined && current !== null ? escapeValue(current) : match;
      },
    );

    hydrated = hydrated.replace(Hydrator.UNRESOLVED_PLACEHOLDER_PATTERN, (match, path) => {
      if (!scope) {
        return "";
      }

      const rootKey = String(path).split(".")[0];
      return scope.has(rootKey) ? "" : match;
    });
    return this.restoreEscapedPlaceholders(hydrated, escaped);
  }

  private static escapeTrustedHtml(html: string): string {
    return Hydrator.escapeExpressions(html).replace(
      /__([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)__/g,
      "&#95;&#95;$1&#95;&#95;",
    );
  }

  private static escapeExpressions(html: string): string {
    return html.replace(/(?<!\\)\{\{/g, "\\{{");
  }

  private extractEscapedPlaceholders(
    html: string,
    escaped: Map<string, string>,
  ): string {
    return html.replace(Hydrator.ESCAPED_PLACEHOLDER_PATTERN, (_match, placeholder) => {
      const marker = `<!--ESCAPED_${escaped.size}-->`;
      escaped.set(marker, `__${placeholder}__`);
      return marker;
    });
  }

  private restoreEscapedPlaceholders(
    html: string,
    escaped: Map<string, string>,
  ): string {
    let restored = html;
    for (const [marker, placeholder] of escaped.entries()) {
      restored = restored.replaceAll(marker, placeholder);
    }
    return restored;
  }
}
