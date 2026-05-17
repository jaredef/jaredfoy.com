import { FunctionRegistry } from "../function-registry";

function isEmptyLike(value: unknown): boolean {
  if (
    value === null ||
    value === "" ||
    value === "0" ||
    value === "false" ||
    value === false ||
    value === 0 ||
    value === 0.0
  ) {
    return true;
  }

  return Array.isArray(value) && value.length === 0;
}

export function registerArrayFunctions(registry: FunctionRegistry): void {
  registry.register("count", (value: unknown) => {
    if (Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === "string") {
      return value.length;
    }
    return 0;
  });

  registry.register("first", (array: unknown) => (Array.isArray(array) && array.length > 0 ? array[0] : null));
  registry.register("last", (array: unknown) =>
    Array.isArray(array) && array.length > 0 ? array[array.length - 1] : null,
  );
  registry.register("reverse", (array: unknown) => (Array.isArray(array) ? [...array].reverse() : []));
  registry.register("sort", (array: unknown) =>
    Array.isArray(array) ? [...array].sort((a, b) => String(a).localeCompare(String(b))) : [],
  );
  registry.register("unique", (array: unknown) =>
    Array.isArray(array) ? [...new Set(array)] : [],
  );
  registry.register("slice", (array: unknown, start: unknown, length?: unknown) =>
    Array.isArray(array)
      ? array.slice(Number(start ?? 0), length === undefined ? undefined : Number(start ?? 0) + Number(length))
      : [],
  );
  registry.register("empty", (value: unknown) => isEmptyLike(value));
  registry.register("defined", (value: unknown) => value !== null);
  registry.register("in_list", (needle: unknown, haystack: unknown) =>
    String(haystack ?? "")
      .split(",")
      .map((item) => item.trim())
      .includes(String(needle ?? "")),
  );
}
