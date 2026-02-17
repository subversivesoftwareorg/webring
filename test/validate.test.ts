import { describe, it, expect } from "vitest";
import { validateFeed, isFeedItem, isAuthor } from "../src/schema/validate";

const validFeed = {
  version: "https://jsonfeed.org/version/1.1",
  title: "Test Feed",
  _webring: { version: "1.0" },
  items: [
    {
      id: "1",
      url: "https://example.com/post-1",
      title: "First Post",
    },
  ],
};

describe("validateFeed", () => {
  it("accepts a minimal valid feed", () => {
    expect(validateFeed(validFeed)).toBe(true);
  });

  it("accepts a fully-populated feed", () => {
    const full = {
      ...validFeed,
      home_page_url: "https://example.com",
      description: "A test feed",
      icon: "https://example.com/icon.png",
      language: "en",
      authors: [{ name: "Alice", url: "https://alice.example.com", avatar: "https://alice.example.com/avatar.png" }],
      _webring: { version: "1.0", tags: ["tech", "web"] },
      items: [
        {
          id: "1",
          url: "https://example.com/post-1",
          title: "First Post",
          summary: "A summary",
          content_text: "Full content",
          image: "https://example.com/img.jpg",
          date_published: "2025-01-01T00:00:00Z",
          date_modified: "2025-01-02T00:00:00Z",
          authors: [{ name: "Bob" }],
          tags: ["test"],
        },
      ],
    };
    expect(validateFeed(full)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateFeed(null)).toBe(false);
  });

  it("rejects missing version", () => {
    const { version, ...rest } = validFeed;
    expect(validateFeed(rest)).toBe(false);
  });

  it("rejects missing title", () => {
    const { title, ...rest } = validFeed;
    expect(validateFeed(rest)).toBe(false);
  });

  it("rejects missing _webring", () => {
    const { _webring, ...rest } = validFeed;
    expect(validateFeed(rest)).toBe(false);
  });

  it("rejects missing items", () => {
    const { items, ...rest } = validFeed;
    expect(validateFeed(rest)).toBe(false);
  });

  it("rejects items with missing id", () => {
    const feed = {
      ...validFeed,
      items: [{ url: "https://example.com", title: "No ID" }],
    };
    expect(validateFeed(feed)).toBe(false);
  });

  it("rejects items with empty id", () => {
    const feed = {
      ...validFeed,
      items: [{ id: "", url: "https://example.com", title: "Empty ID" }],
    };
    expect(validateFeed(feed)).toBe(false);
  });

  it("rejects items with missing url", () => {
    const feed = {
      ...validFeed,
      items: [{ id: "1", title: "No URL" }],
    };
    expect(validateFeed(feed)).toBe(false);
  });

  it("rejects non-string optional fields", () => {
    const feed = {
      ...validFeed,
      description: 42,
    };
    expect(validateFeed(feed)).toBe(false);
  });

  it("rejects invalid _webring.tags (non-string entries)", () => {
    const feed = {
      ...validFeed,
      _webring: { version: "1.0", tags: [1, 2] },
    };
    expect(validateFeed(feed)).toBe(false);
  });
});

describe("isFeedItem", () => {
  it("accepts minimal item", () => {
    expect(isFeedItem({ id: "1", url: "https://x.com", title: "T" })).toBe(true);
  });

  it("rejects non-object", () => {
    expect(isFeedItem("string")).toBe(false);
  });

  it("rejects invalid tags type", () => {
    expect(isFeedItem({ id: "1", url: "https://x.com", title: "T", tags: "not-array" })).toBe(false);
  });
});

describe("isAuthor", () => {
  it("accepts empty object", () => {
    expect(isAuthor({})).toBe(true);
  });

  it("accepts full author", () => {
    expect(isAuthor({ name: "A", url: "https://a.com", avatar: "https://a.com/img.png" })).toBe(true);
  });

  it("rejects non-string name", () => {
    expect(isAuthor({ name: 42 })).toBe(false);
  });
});
