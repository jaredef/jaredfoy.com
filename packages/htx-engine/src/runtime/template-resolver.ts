import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { TemplateDirectoryResolver } from "./types";

export class TemplateResolver implements TemplateDirectoryResolver {
  private readonly templateDirs: string[];

  constructor(templateDirs: string | string[]) {
    const dirs = Array.isArray(templateDirs) ? templateDirs : [templateDirs];
    this.templateDirs = dirs.map((dir) => dir.replace(/\/+$/, ""));
  }

  resolve(relativePath: string): string | null {
    const normalized = relativePath.replace(/^\/+/, "");

    for (const dir of this.templateDirs) {
      const candidate = path.join(dir, normalized);
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  exists(relativePath: string): boolean {
    return this.resolve(relativePath) !== null;
  }

  resolveDir(relativePath: string): string | null {
    const normalized = relativePath.replace(/^\/+/, "");

    for (const dir of this.templateDirs) {
      const candidate = path.join(dir, normalized);
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    }

    return null;
  }

  scanDir(relativePath: string): string[] {
    const normalized = relativePath.replace(/^\/+/, "");
    const seen = new Map<string, string>();

    for (const dir of this.templateDirs) {
      const candidate = path.join(dir, normalized);
      if (!existsSync(candidate) || !statSync(candidate).isDirectory()) {
        continue;
      }

      for (const entry of readdirSync(candidate)) {
        if (!seen.has(entry)) {
          seen.set(entry, path.join(candidate, entry));
        }
      }
    }

    return [...seen.values()];
  }

  getPrimary(): string {
    return this.templateDirs[0];
  }

  getDirs(): string[] {
    return [...this.templateDirs];
  }
}
