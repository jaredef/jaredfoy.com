import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TemplateResolver } from "./template-resolver";
import type { TemplateRoot } from "./types";

const LAYOUT_FILE = "_layout.htx";
const CONTENT_PLACEHOLDER = "__content__";

export class LayoutResolver {
  wrap(content: string, filePath: string, siteRoot: TemplateRoot, skipRoot = false): string {
    const layouts =
      typeof siteRoot === "string"
        ? this.collectLayouts(filePath, siteRoot)
        : siteRoot instanceof TemplateResolver
          ? this.collectLayoutsChained(filePath, siteRoot)
          : this.collectLayouts(filePath, siteRoot.getDirs()[0] ?? ".");

    if (skipRoot && layouts.length > 0) {
      const lastLayout = layouts[layouts.length - 1];
      try {
        const lastContent = readFileSync(lastLayout, "utf8");
        if (lastContent.toLowerCase().includes("<!doctype html")) {
          layouts.pop();
        }
      } catch {
        layouts.pop();
      }
    }

    let output = content;
    for (const layoutPath of layouts) {
      try {
        const layoutContent = readFileSync(layoutPath, "utf8");
        output = layoutContent.replaceAll(CONTENT_PLACEHOLDER, output);
      } catch {
        continue;
      }
    }

    return output;
  }

  private collectLayoutsChained(filePath: string, resolver: TemplateResolver): string[] {
    const resolvedFile = path.resolve(filePath);
    let relativePath: string | null = null;

    for (const dir of resolver.getDirs()) {
      const resolvedDir = path.resolve(dir);
      if (resolvedFile.startsWith(`${resolvedDir}${path.sep}`)) {
        relativePath = resolvedFile.slice(resolvedDir.length + 1);
        break;
      }
    }

    if (relativePath === null) {
      return this.collectLayouts(filePath, resolver.getPrimary());
    }

    const layouts: string[] = [];
    let relativeDir = path.dirname(relativePath);

    while (true) {
      const layoutRelative = relativeDir === "." ? LAYOUT_FILE : `${relativeDir}/${LAYOUT_FILE}`;
      const layoutPath = resolver.resolve(layoutRelative);
      if (layoutPath) {
        try {
          const layoutContent = readFileSync(layoutPath, "utf8");
          layouts.push(layoutPath);
          if (layoutContent.toLowerCase().includes("<!doctype html")) {
            break;
          }
        } catch {
          // Skip unreadable layout files and continue walking upward.
        }
      }

      if (relativeDir === "." || relativeDir === "") {
        break;
      }

      const parentDir = path.dirname(relativeDir);
      if (parentDir === relativeDir) {
        break;
      }
      relativeDir = parentDir;
    }

    return layouts;
  }

  private collectLayouts(filePath: string, siteRoot: string): string[] {
    const resolvedRoot = path.resolve(siteRoot);
    let currentDir = path.dirname(path.resolve(filePath));
    const layouts: string[] = [];

    while (true) {
      const layoutFile = path.join(currentDir, LAYOUT_FILE);
      if (existsSync(layoutFile)) {
        try {
          const fileContent = readFileSync(layoutFile, "utf8");
          layouts.push(layoutFile);
          if (fileContent.toLowerCase().includes("<!doctype html")) {
            break;
          }
        } catch {
          // Skip unreadable layout files — matches PHP behavior
        }
      }

      if (currentDir === resolvedRoot) {
        break;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir || parentDir.length < resolvedRoot.length) {
        break;
      }
      currentDir = parentDir;
    }

    return layouts;
  }
}
