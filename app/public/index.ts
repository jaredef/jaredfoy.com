import { createEngine } from "@htx/engine";
import { SQLiteAdapter } from "@htx/adapter-sqlite";
import { resolve } from "path";

const db = new SQLiteAdapter(resolve(import.meta.dir, "../data/corpus.sqlite"));
const engine = createEngine({
  templateDir: resolve(import.meta.dir, "../templates"),
  adapter: db,
  host: process.env.HTX_HOST || "0.0.0.0",
  port: parseInt(process.env.HTX_PORT || "3001"),
  publicDir: resolve(import.meta.dir, "./"),
});

engine.start();
console.log(`jaredfoy.com running on http://localhost:${process.env.HTX_PORT || 3001}`);
