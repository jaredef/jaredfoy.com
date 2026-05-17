import { expect, test } from "bun:test";

import { AdapterRegistry, DSLParser, ExpressionEngine, GetContentExecutor, Hydrator } from "@htx/engine";

import { SQLiteAdapter } from "../src";

test("schema is created automatically", () => {
  const adapter = new SQLiteAdapter(":memory:");
  const table = adapter
    .getDatabase()
    .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content'")
    .get() as { name: string } | null;

  expect(table?.name).toBe("content");
});

test("create, find, and findBySlug flatten meta fields", () => {
  const adapter = new SQLiteAdapter(":memory:");
  const created = adapter.create("post", {
    title: "Tagged Post",
    category: "tech",
    priority: "high",
  });

  expect(created.slug).toBe("tagged-post");
  expect(created.category).toBe("tech");
  expect(adapter.find("post", Number(created.id))?.priority).toBe("high");
  expect(adapter.findBySlug("post", "tagged-post")?.title).toBe("Tagged Post");
});

test("query supports meta filters, ordering, pagination, and slug shortcuts", () => {
  const adapter = new SQLiteAdapter(":memory:");
  adapter.create("item", { title: "Banana", category: "fruit" });
  adapter.create("item", { title: "Apple", category: "fruit" });
  adapter.create("item", { title: "Cherry", category: "fruit" });

  const filtered = adapter.query({
    type: "item",
    where: "category=fruit",
    order: "alpha",
    howmany: 2,
    offset: 1,
  });

  expect(filtered.total).toBe(3);
  expect(filtered.rows).toHaveLength(2);
  expect(filtered.rows[0]?.title).toBe("Banana");
  expect(filtered.rows[1]?.title).toBe("Cherry");

  const single = adapter.query({
    type: "item",
    slug: "apple",
  });

  expect(single.total).toBe(1);
  expect(single.rows[0]?.title).toBe("Apple");
});

test("update preserves custom meta fields and delete removes records", () => {
  const adapter = new SQLiteAdapter(":memory:");
  const created = adapter.create("post", {
    title: "Original",
    category: "tech",
    priority: "high",
  });

  const updated = adapter.update("post", Number(created.id), {
    title: "Updated",
  });

  expect(updated.title).toBe("Updated");
  expect(updated.category).toBe("tech");
  expect(updated.priority).toBe("high");

  adapter.delete("post", Number(created.id));
  expect(adapter.find("post", Number(created.id))).toBeNull();
});

test("duplicate slugs are unique per type and not across different types", () => {
  const adapter = new SQLiteAdapter(":memory:");
  adapter.create("post", { title: "Hello World" });

  expect(() => adapter.create("post", { title: "Hello World" })).toThrow();

  const page = adapter.create("page", { title: "Hello World" });
  expect(page.slug).toBe("hello-world");
});

test("sqlite adapter works through get executor rendering", async () => {
  const adapter = new SQLiteAdapter(":memory:");
  adapter.create("post", {
    title: "Rendered Post",
    status: "published",
    category: "tech",
  });
  adapter.create("post", {
    title: "Draft Post",
    status: "draft",
  });

  const executor = new GetContentExecutor(
    new DSLParser(),
    new AdapterRegistry({ default: adapter }),
    new Hydrator(),
    new ExpressionEngine(),
  );

  const html = await executor.execute(`
<htx:type>post</htx:type>
<htx:where>status=published,category=tech</htx:where>
<htx>
<htx:each><article>{{ title }}</article></htx:each>
</htx>
`);

  expect(html).toContain("<article>Rendered Post</article>");
  expect(html).not.toContain("Draft Post");
});
