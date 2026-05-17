import { FunctionRegistry } from "../function-registry";

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    if (!Number.isNaN(Number(value))) {
      return Number(value);
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
  }

  return null;
}

export function registerDateFunctions(registry: FunctionRegistry): void {
  registry.register("format_date", (value: unknown, format: unknown) => {
    const timestamp = toTimestamp(value);
    if (timestamp === null) {
      return String(value ?? "");
    }

    const date = new Date(timestamp * 1000);
    const fmt = String(format ?? "");
    return fmt
      .replaceAll("Y", String(date.getUTCFullYear()))
      .replaceAll("m", String(date.getUTCMonth() + 1).padStart(2, "0"))
      .replaceAll("d", String(date.getUTCDate()).padStart(2, "0"))
      .replaceAll("H", String(date.getUTCHours()).padStart(2, "0"))
      .replaceAll("i", String(date.getUTCMinutes()).padStart(2, "0"))
      .replaceAll("s", String(date.getUTCSeconds()).padStart(2, "0"));
  });

  registry.register("time_ago", (value: unknown) => {
    const timestamp = toTimestamp(value);
    if (timestamp === null) {
      return String(value ?? "");
    }

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    const abs = Math.abs(diff);
    const future = diff < 0;

    if (abs < 60) {
      return "just now";
    }

    const units = [
      [60, "minute"],
      [3600, "hour"],
      [86400, "day"],
      [2592000, "month"],
      [31536000, "year"],
    ] as const;

    let label = "";
    let count = 0;
    for (let index = units.length - 1; index >= 0; index -= 1) {
      if (abs >= units[index][0]) {
        label = units[index][1];
        count = Math.floor(abs / units[index][0]);
        break;
      }
    }

    if (!label) {
      return "just now";
    }

    const plural = count !== 1 ? "s" : "";
    return future ? `in ${count} ${label}${plural}` : `${count} ${label}${plural} ago`;
  });

  registry.register("days_since", (value: unknown) => {
    const timestamp = toTimestamp(value);
    if (timestamp === null) {
      return 0;
    }
    return Math.floor((Math.floor(Date.now() / 1000) - timestamp) / 86400);
  });

  registry.register("is_past", (value: unknown) => {
    const timestamp = toTimestamp(value);
    return timestamp === null ? false : timestamp < Math.floor(Date.now() / 1000);
  });

  registry.register("is_future", (value: unknown) => {
    const timestamp = toTimestamp(value);
    return timestamp === null ? false : timestamp > Math.floor(Date.now() / 1000);
  });

  registry.register("year", (value: unknown) => {
    const timestamp = toTimestamp(value);
    return timestamp === null ? "" : String(new Date(timestamp * 1000).getUTCFullYear());
  });
}
