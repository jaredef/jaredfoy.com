import { FunctionRegistry } from "../function-registry";

function toNumber(value: unknown): number {
  const num = Number(value ?? 0);
  return Number.isNaN(num) ? 0 : num;
}

export function registerNumberFunctions(registry: FunctionRegistry): void {
  registry.register("clamp", (value: unknown, min: unknown, max: unknown) =>
    Math.max(toNumber(min), Math.min(toNumber(max), toNumber(value))),
  );
  registry.register("round", (value: unknown, decimals: unknown = 0) => {
    const precision = toNumber(decimals);
    const factor = 10 ** precision;
    return Math.round(toNumber(value) * factor) / factor;
  });
  registry.register("floor", (value: unknown) => Math.floor(toNumber(value)));
  registry.register("ceil", (value: unknown) => Math.ceil(toNumber(value)));
  registry.register("abs", (value: unknown) => Math.abs(toNumber(value)));
  registry.register("min", (a: unknown, b: unknown) => Math.min(toNumber(a), toNumber(b)));
  registry.register("max", (a: unknown, b: unknown) => Math.max(toNumber(a), toNumber(b)));
  registry.register("mult", (a: unknown, b: unknown) => toNumber(a) * toNumber(b));
  registry.register("div", (a: unknown, b: unknown) => {
    const divisor = toNumber(b);
    return divisor !== 0 ? toNumber(a) / divisor : 0;
  });
  registry.register("add", (a: unknown, b: unknown) => toNumber(a) + toNumber(b));
  registry.register("sub", (a: unknown, b: unknown) => toNumber(a) - toNumber(b));
  registry.register("number_format", (value: unknown, decimals: unknown = 0, thousandsSep: unknown = ",") => {
    return toNumber(value).toLocaleString("en-US", {
      minimumFractionDigits: toNumber(decimals),
      maximumFractionDigits: toNumber(decimals),
      useGrouping: true,
    }).replaceAll(",", String(thousandsSep ?? ","));
  });
  registry.register("percent", (value: unknown, total: unknown) => {
    const totalValue = toNumber(total);
    if (totalValue === 0) {
      return 0;
    }
    return (toNumber(value) / totalValue) * 100;
  });
  registry.register("int", (value: unknown) => Math.trunc(toNumber(value)));
  registry.register("float", (value: unknown) => toNumber(value));
  registry.register("bool", (value: unknown) => {
    if (typeof value === "string") {
      return !["", "0", "false", "no"].includes(value.toLowerCase());
    }
    return Boolean(value);
  });
}
