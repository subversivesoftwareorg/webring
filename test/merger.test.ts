import { describe, it, expect } from "vitest";
import { merge } from "../src/core/merger";
import type { FetchResult, MergedEntry } from "../src/core/types";

function makeEntry(overrides: Partial<MergedEntry> & { id: string; url: string; title: string }): MergedEntry {
  return {
    authors: [],
    tags: [],
    feedTitle: "Test Feed",
    feedUrl: "https://test.example.com/feed.json",
    ...overrides,
  };
}

function success(entries: MergedEntry[]): FetchResult {
  return { ok: true, url: "https://test.example.com/feed.json", feedTitle: "Test", entries };
}

function failure(url: string): FetchResult {
  return { ok: false, url, error: "fetch failed" };
}

describe("merge", () => {
  const defaults = { sortBy: "date" as const, sortOrder: "desc" as const, maxItems: 25, tags: [] };

  it("collects entries from multiple successful results", () => {
    const results: FetchResult[] = [
      success([makeEntry({ id: "1", url: "https://a.com/1", title: "A" })]),
      success([makeEntry({ id: "2", url: "https://b.com/2", title: "B" })]),
    ];
    const entries = merge(results, defaults);
    expect(entries).toHaveLength(2);
  });

  it("ignores failed results", () => {
    const results: FetchResult[] = [
      success([makeEntry({ id: "1", url: "https://a.com/1", title: "A" })]),
      failure("https://broken.example.com"),
    ];
    const entries = merge(results, defaults);
    expect(entries).toHaveLength(1);
  });

  it("deduplicates by normalized URL", () => {
    const results: FetchResult[] = [
      success([makeEntry({ id: "1", url: "https://example.com/post/", title: "First" })]),
      success([makeEntry({ id: "2", url: "https://EXAMPLE.COM/post", title: "Duplicate" })]),
    ];
    const entries = merge(results, defaults);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("First"); // keeps the first occurrence
  });

  it("sorts by date descending", () => {
    const results: FetchResult[] = [
      success([
        makeEntry({ id: "1", url: "https://a.com/old", title: "Old", datePublished: new Date("2024-01-01") }),
        makeEntry({ id: "2", url: "https://a.com/new", title: "New", datePublished: new Date("2025-06-01") }),
      ]),
    ];
    const entries = merge(results, { ...defaults, sortBy: "date", sortOrder: "desc" });
    expect(entries[0].title).toBe("New");
    expect(entries[1].title).toBe("Old");
  });

  it("sorts by date ascending", () => {
    const results: FetchResult[] = [
      success([
        makeEntry({ id: "1", url: "https://a.com/old", title: "Old", datePublished: new Date("2024-01-01") }),
        makeEntry({ id: "2", url: "https://a.com/new", title: "New", datePublished: new Date("2025-06-01") }),
      ]),
    ];
    const entries = merge(results, { ...defaults, sortBy: "date", sortOrder: "asc" });
    expect(entries[0].title).toBe("Old");
    expect(entries[1].title).toBe("New");
  });

  it("sorts by title", () => {
    const results: FetchResult[] = [
      success([
        makeEntry({ id: "1", url: "https://a.com/z", title: "Zebra" }),
        makeEntry({ id: "2", url: "https://a.com/a", title: "Apple" }),
      ]),
    ];
    const entries = merge(results, { ...defaults, sortBy: "title", sortOrder: "asc" });
    expect(entries[0].title).toBe("Apple");
    expect(entries[1].title).toBe("Zebra");
  });

  it("caps results at maxItems", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: String(i), url: `https://a.com/${i}`, title: `Post ${i}` }),
    );
    const results: FetchResult[] = [success(items)];
    const entries = merge(results, { ...defaults, maxItems: 3 });
    expect(entries).toHaveLength(3);
  });

  it("filters by tags (case-insensitive)", () => {
    const results: FetchResult[] = [
      success([
        makeEntry({ id: "1", url: "https://a.com/1", title: "Rust Post", tags: ["Rust", "wasm"] }),
        makeEntry({ id: "2", url: "https://a.com/2", title: "CSS Post", tags: ["css"] }),
        makeEntry({ id: "3", url: "https://a.com/3", title: "No Tags" }),
      ]),
    ];
    const entries = merge(results, { ...defaults, tags: ["rust"] });
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("Rust Post");
  });

  it("entries without dates sort to end", () => {
    const results: FetchResult[] = [
      success([
        makeEntry({ id: "1", url: "https://a.com/1", title: "No Date" }),
        makeEntry({ id: "2", url: "https://a.com/2", title: "Has Date", datePublished: new Date("2025-01-01") }),
      ]),
    ];
    const entries = merge(results, { ...defaults, sortBy: "date", sortOrder: "desc" });
    expect(entries[0].title).toBe("Has Date");
    expect(entries[1].title).toBe("No Date");
  });

  it("random sort returns all entries", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: String(i), url: `https://a.com/${i}`, title: `Post ${i}` }),
    );
    const results: FetchResult[] = [success(items)];
    const entries = merge(results, { ...defaults, sortBy: "random" });
    expect(entries).toHaveLength(5);
  });
});
