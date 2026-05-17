import { FunctionRegistry } from "../function-registry";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function registerStringFunctions(registry: FunctionRegistry): void {
  registry.register("truncate", (value: unknown, length: unknown, suffix: unknown = "...") => {
    const input = String(value ?? "");
    const max = Number(length ?? 0);
    if (input.length <= max) {
      return input;
    }
    return input.slice(0, max) + String(suffix ?? "...");
  });

  registry.register("split", (value: unknown, delimiter: unknown) => {
    const input = String(value ?? "");
    if (input === "") {
      return [];
    }
    return input.split(String(delimiter ?? ""));
  });

  registry.register("join", (array: unknown, delimiter: unknown) => {
    return Array.isArray(array) ? array.join(String(delimiter ?? "")) : "";
  });

  registry.register("trim", (value: unknown) => String(value ?? "").trim());
  registry.register("uppercase", (value: unknown) => String(value ?? "").toUpperCase());
  registry.register("lowercase", (value: unknown) => String(value ?? "").toLowerCase());
  registry.register("capitalize", (value: unknown) => {
    const input = String(value ?? "");
    return input.length === 0 ? input : input[0].toUpperCase() + input.slice(1);
  });
  registry.register("replace", (value: unknown, search: unknown, replacement: unknown) =>
    String(value ?? "").replaceAll(String(search ?? ""), String(replacement ?? "")),
  );
  registry.register("contains", (value: unknown, search: unknown) =>
    String(value ?? "").includes(String(search ?? "")),
  );
  registry.register("starts_with", (value: unknown, prefix: unknown) =>
    String(value ?? "").startsWith(String(prefix ?? "")),
  );
  registry.register("length", (value: unknown) =>
    Array.isArray(value) ? value.length : String(value ?? "").length,
  );
  registry.register("default", (value: unknown, fallback: unknown) =>
    value === null || value === "" || value === false ? fallback : value,
  );
  registry.register("slug", (value: unknown) => slugify(String(value ?? "")));
  registry.register("prepend", (value: unknown, prefix: unknown) => String(prefix ?? "") + String(value ?? ""));
  registry.register("append", (value: unknown, suffix: unknown) => String(value ?? "") + String(suffix ?? ""));
  registry.register("nl2br", (value: unknown) => String(value ?? "").replace(/\n/g, "<br>\n"));
  registry.register("md", (value: unknown) =>
    String(value ?? "")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>'),
  );
  registry.register("match", (...args: unknown[]) => {
    if (args.length < 3) {
      return args[0] ?? "";
    }
    const value = args[0];
    let index = 1;
    while (index + 1 < args.length) {
      if (String(value) === String(args[index])) {
        return args[index + 1];
      }
      index += 2;
    }
    return index < args.length ? args[index] : "";
  });
  registry.register("regex", (value: unknown, pattern: unknown) =>
    new RegExp(String(pattern ?? "")).test(String(value ?? "")),
  );
  registry.register("regex_capture", (value: unknown, pattern: unknown, group: unknown = 1) => {
    const match = String(value ?? "").match(new RegExp(String(pattern ?? "")));
    const index = Number(group ?? 1);
    return match?.[index] ?? "";
  });
  registry.register("coalesce", (...args: unknown[]) => {
    for (const arg of args) {
      if (arg !== null && arg !== "" && arg !== false) {
        return arg;
      }
    }
    return "";
  });
}
