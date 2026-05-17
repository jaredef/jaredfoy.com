import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { TemplateResolver } from "./template-resolver";
import type { TemplateRoot } from "./types";

const MAX_DEPTH = 10;
const INCLUDE_PATTERN = /<htx:include\s+src=["']([^"']+)["']\s*\/?>/g;

export class IncludeResolver {
  private templateResolver: TemplateResolver | null = null;

  setTemplateResolver(resolver: TemplateResolver): void {
    this.templateResolver = resolver;
  }

  expand(content: string, filePath: string, siteRoot: TemplateRoot): string {
    let resolver: TemplateResolver | null = null;
    let siteRootString = "";

    if (typeof siteRoot === "string") {
      resolver = this.templateResolver;
      siteRootString = path.resolve(siteRoot);
    } else if (siteRoot instanceof TemplateResolver) {
      resolver = siteRoot;
      siteRootString = path.resolve(resolver.getPrimary());
    } else {
      resolver = null;
      siteRootString = path.resolve(siteRoot.getDirs()[0] ?? ".");
    }

    const resolvedFile = path.resolve(filePath);
    return this.expandIncludes(content, resolvedFile, siteRootString, [resolvedFile], resolver);
  }

  private expandIncludes(
    content: string,
    currentFile: string,
    siteRoot: string,
    stack: string[],
    resolver: TemplateResolver | null,
  ): string {
    return content.replace(INCLUDE_PATTERN, (_match, src) => {
      const resolvedPath = this.resolvePath(src, currentFile, siteRoot, resolver);

      if (stack.includes(resolvedPath)) {
        const chain = [...stack, resolvedPath].map((p) => path.relative(siteRoot, p));
        throw new Error(`Circular include detected: ${chain.join(" -> ")}`);
      }

      if (stack.length >= MAX_DEPTH) {
        throw new Error(`Include depth exceeded (max ${MAX_DEPTH}): ${resolvedPath}`);
      }

      if (!existsSync(resolvedPath)) {
        throw new Error(`Include not found: ${resolvedPath} (included from ${currentFile})`);
      }

      const partial = readFileSync(resolvedPath, "utf8");
      return this.expandIncludes(partial, resolvedPath, siteRoot, [...stack, resolvedPath], resolver);
    });
  }

  private resolvePath(
    src: string,
    currentFile: string,
    siteRoot: string,
    resolver: TemplateResolver | null,
  ): string {
    let resolvedPath: string;

    if (src.startsWith("/")) {
      if (resolver) {
        const chainResolved = resolver.resolve(src.slice(1));
        if (chainResolved) {
          return path.resolve(chainResolved);
        }
      }
      resolvedPath = path.resolve(siteRoot, `.${src}`);
    } else {
      resolvedPath = path.resolve(path.dirname(currentFile), src);
    }

    if (resolver) {
      const inChain = resolver.getDirs().some((dir) => {
        const resolvedDir = path.resolve(dir);
        return resolvedPath === resolvedDir || resolvedPath.startsWith(`${resolvedDir}${path.sep}`);
      });

      if (!inChain && !(resolvedPath === siteRoot || resolvedPath.startsWith(`${siteRoot}${path.sep}`))) {
        throw new Error(`Include path escapes site root: ${src}`);
      }
    } else if (!(resolvedPath === siteRoot || resolvedPath.startsWith(`${siteRoot}${path.sep}`))) {
      throw new Error(`Include path escapes site root: ${src}`);
    }

    return resolvedPath;
  }
}
