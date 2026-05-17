import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import type { RouteMatch, TemplateRoot } from "./types";
import { TemplateResolver } from "./template-resolver";

const DYNAMIC_FILE_RE = /^\[([a-zA-Z_][a-zA-Z0-9_]*)\]\.htx$/;
const DYNAMIC_DIR_RE = /^\[([a-zA-Z_][a-zA-Z0-9_]*)\]$/;

export class Router {
  resolve(urlPath: string, siteRoot: TemplateRoot): RouteMatch | null {
    if (typeof siteRoot === "string") {
      return this.resolveInDir(urlPath, siteRoot);
    }

    if (siteRoot instanceof TemplateResolver) {
      for (const dir of siteRoot.getDirs()) {
        const match = this.resolveInDir(urlPath, dir);
        if (match) {
          return match;
        }
      }
      return null;
    }

    for (const dir of siteRoot.getDirs()) {
      const match = this.resolveInDir(urlPath, dir);
      if (match) {
        return match;
      }
    }

    return null;
  }

  private resolveInDir(urlPath: string, siteRoot: string): RouteMatch | null {
    const normalizedRoot = siteRoot.replace(/\/+$/, "");
    const routePath = this.normalizePath(urlPath);

    if (this.isExcluded(routePath) || routePath.includes("..")) {
      return null;
    }

    const exactFile = path.join(normalizedRoot, `${routePath}.htx`);
    if (this.isSafeFile(exactFile, normalizedRoot)) {
      return { filePath: exactFile, params: {}, siteRoot: normalizedRoot };
    }

    const indexFile = path.join(normalizedRoot, routePath, "index.htx");
    if (this.isSafeFile(indexFile, normalizedRoot)) {
      return { filePath: indexFile, params: {}, siteRoot: normalizedRoot };
    }

    const dynamic = this.resolveDynamic(routePath, normalizedRoot);
    if (dynamic) {
      return dynamic;
    }

    return this.resolveCatchAll(routePath, normalizedRoot);
  }

  private normalizePath(urlPath: string): string {
    const pathname = urlPath.split("?")[0] || "/";
    const trimmed = pathname.replace(/^\/+|\/+$/g, "");
    return trimmed === "" ? "index" : trimmed;
  }

  private isExcluded(routePath: string): boolean {
    const segments = routePath.split("/");
    for (const segment of segments) {
      if (segment.startsWith("_") || segment === "partials") {
        return true;
      }
    }
    return segments[0] === "public";
  }

  private resolveCatchAll(routePath: string, siteRoot: string): RouteMatch | null {
    const segments = routePath.split("/");

    for (let index = segments.length - 1; index >= 1; index -= 1) {
      const dirSegments = segments.slice(0, index);
      const slugSegments = segments.slice(index);
      const dir = path.join(siteRoot, ...dirSegments);

      if (!existsSync(dir) || !statSync(dir).isDirectory()) {
        continue;
      }

      const slug = slugSegments.join("/");
      const dynamic = this.findDynamicFile(dir, slug, {});
      if (dynamic) {
        return { filePath: dynamic.filePath, params: dynamic.params, siteRoot };
      }
    }

    return null;
  }

  private resolveDynamic(routePath: string, siteRoot: string): RouteMatch | null {
    const segments = routePath.split("/");
    return this.walkSegments(segments, 0, siteRoot, siteRoot, {});
  }

  private walkSegments(
    segments: string[],
    index: number,
    currentDir: string,
    siteRoot: string,
    params: Record<string, string>,
  ): RouteMatch | null {
    if (index === segments.length - 1) {
      const lastSegment = segments[index];
      const exactFile = path.join(currentDir, `${lastSegment}.htx`);
      if (this.isSafeFile(exactFile, siteRoot)) {
        return { filePath: exactFile, params, siteRoot };
      }

      const indexFile = path.join(currentDir, lastSegment, "index.htx");
      if (this.isSafeFile(indexFile, siteRoot)) {
        return { filePath: indexFile, params, siteRoot };
      }

      for (const entry of this.scanDirectory(currentDir)) {
        const dirMatch = DYNAMIC_DIR_RE.exec(entry);
        if (!dirMatch) {
          continue;
        }

        const paramName = dirMatch[1];
        const dynamicDir = path.join(currentDir, entry);
        if (!this.isSafeDir(dynamicDir, siteRoot)) {
          continue;
        }

        const dynamicIndex = path.join(dynamicDir, "index.htx");
        if (this.isSafeFile(dynamicIndex, siteRoot)) {
          return {
            filePath: dynamicIndex,
            params: { ...params, [paramName]: lastSegment },
            siteRoot,
          };
        }
      }

      const dynamic = this.findDynamicFile(currentDir, lastSegment, params);
      if (dynamic) {
        return { filePath: dynamic.filePath, params: dynamic.params, siteRoot };
      }

      return null;
    }

    const segment = segments[index];
    const exactDir = path.join(currentDir, segment);
    if (this.isSafeDir(exactDir, siteRoot)) {
      const result = this.walkSegments(segments, index + 1, exactDir, siteRoot, params);
      if (result) {
        return result;
      }
    }

    for (const entry of this.scanDirectory(currentDir)) {
      const dirMatch = DYNAMIC_DIR_RE.exec(entry);
      if (!dirMatch) {
        continue;
      }

      const paramName = dirMatch[1];
      const dynamicDir = path.join(currentDir, entry);
      if (!this.isSafeDir(dynamicDir, siteRoot)) {
        continue;
      }

      const result = this.walkSegments(segments, index + 1, dynamicDir, siteRoot, {
        ...params,
        [paramName]: segment,
      });
      if (result) {
        return result;
      }
    }

    const restSlug = segments.slice(index).join("/");
    const catchAll = this.findDynamicFile(currentDir, restSlug, params);
    if (catchAll) {
      return { filePath: catchAll.filePath, params: catchAll.params, siteRoot };
    }

    return null;
  }

  private findDynamicFile(
    directory: string,
    value: string,
    params: Record<string, string>,
  ): { filePath: string; params: Record<string, string> } | null {
    for (const entry of this.scanDirectory(directory)) {
      const fileMatch = DYNAMIC_FILE_RE.exec(entry);
      if (!fileMatch) {
        continue;
      }

      const paramName = fileMatch[1];
      const filePath = path.join(directory, entry);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        continue;
      }

      return {
        filePath,
        params: {
          ...params,
          [paramName]: value,
        },
      };
    }

    return null;
  }

  private scanDirectory(directory: string): string[] {
    if (!existsSync(directory) || !statSync(directory).isDirectory()) {
      return [];
    }

    return readdirSync(directory);
  }

  private isSafeFile(candidate: string, siteRoot: string): boolean {
    return this.isWithinRoot(candidate, siteRoot) && existsSync(candidate) && statSync(candidate).isFile();
  }

  private isSafeDir(candidate: string, siteRoot: string): boolean {
    return this.isWithinRoot(candidate, siteRoot) && existsSync(candidate) && statSync(candidate).isDirectory();
  }

  private isWithinRoot(candidate: string, siteRoot: string): boolean {
    const relative = path.relative(siteRoot, candidate);
    return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }
}
