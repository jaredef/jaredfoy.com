import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { RequestHandler } from "./request-handler";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        if (separator === -1) {
          return [part, ""];
        }

        const name = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        return [name, decodeURIComponent(value)];
      }),
  );
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".css":
      return "text/css; charset=UTF-8";
    case ".js":
      return "text/javascript; charset=UTF-8";
    case ".json":
      return "application/json; charset=UTF-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export class HttpHost {
  private readonly handler: RequestHandler;
  private readonly publicDir: string;

  constructor(handler: RequestHandler, publicDir: string) {
    this.handler = handler;
    this.publicDir = publicDir;
  }

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const staticResponse = this.serveStatic(pathname);
    if (staticResponse) {
      return staticResponse;
    }

    const body = await this.parseBody(request);
    const query = Object.fromEntries(url.searchParams.entries());
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const response = await this.handler.handle({
      method: request.method,
      path: pathname,
      headers,
      body,
      query,
      cookies: parseCookies(request.headers.get("cookie")),
      raw: request,
    });

    return response.toWebResponse();
  }

  private serveStatic(pathname: string): Response | null {
    if (pathname === "/") {
      return null;
    }

    const candidate = path.resolve(this.publicDir, `.${pathname}`);
    const resolvedPublicDir = path.resolve(this.publicDir);
    if (
      !candidate.startsWith(`${resolvedPublicDir}${path.sep}`) ||
      !existsSync(candidate) ||
      !statSync(candidate).isFile()
    ) {
      return null;
    }

    return new Response(readFileSync(candidate), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(candidate),
      },
    });
  }

  private async parseBody(request: Request): Promise<Record<string, unknown>> {
    if (request.method === "GET" || request.method === "HEAD") {
      return {};
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      return Object.fromEntries(formData.entries());
    }

    if (contentType.includes("application/json")) {
      const json = await request.json();
      return json && typeof json === "object" && !Array.isArray(json) ? json : {};
    }

    const text = await request.text();
    return text ? { raw: text } : {};
  }
}
