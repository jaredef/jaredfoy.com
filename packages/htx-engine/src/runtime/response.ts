import type { HtxHeaders } from "./types";

export class Response {
  status: number;
  body: string;
  headers: HtxHeaders;
  cookies: string[];

  constructor(status = 200, body = "", headers: HtxHeaders = {}, cookies: string[] = []) {
    this.status = status;
    this.body = body;
    this.headers = headers;
    this.cookies = cookies;
  }

  static redirect(url: string, status = 302): Response {
    return new Response(status, "", { Location: url });
  }

  static notFound(body = "<h1>404 Not Found</h1>"): Response {
    return new Response(404, body, { "Content-Type": "text/html; charset=UTF-8" });
  }

  static error(body = "<h1>500 Internal Server Error</h1>"): Response {
    return new Response(500, body, { "Content-Type": "text/html; charset=UTF-8" });
  }

  toWebResponse(): globalThis.Response {
    const headers = new Headers(this.headers);
    for (const cookie of this.cookies) {
      headers.append("Set-Cookie", cookie);
    }
    return new globalThis.Response(this.body, {
      status: this.status,
      headers,
    });
  }
}
