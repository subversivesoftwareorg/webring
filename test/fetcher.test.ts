import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFeeds } from "../src/core/fetcher";

const validFeedJson = {
  version: "https://jsonfeed.org/version/1.1",
  title: "Test Feed",
  _webring: { version: "1.0" },
  items: [
    {
      id: "1",
      url: "https://example.com/post-1",
      title: "Test Post",
      summary: "A test post",
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchFeeds", () => {
  it("returns success for a valid feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validFeedJson),
      }),
    );

    const results = await fetchFeeds(["https://test.com/feed.json"], 5000);
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(true);
    if (results[0].ok) {
      expect(results[0].entries).toHaveLength(1);
      expect(results[0].entries[0].title).toBe("Test Post");
      expect(results[0].feedTitle).toBe("Test Feed");
    }
  });

  it("returns failure for HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const results = await fetchFeeds(["https://test.com/feed.json"], 5000);
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBe(false);
    if (!results[0].ok) {
      expect(results[0].error).toBe("HTTP 404");
    }
  });

  it("returns failure for invalid JSON feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ not: "a feed" }),
      }),
    );

    const results = await fetchFeeds(["https://test.com/feed.json"], 5000);
    expect(results[0].ok).toBe(false);
    if (!results[0].ok) {
      expect(results[0].error).toBe("Invalid feed format");
    }
  });

  it("returns failure for network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const results = await fetchFeeds(["https://test.com/feed.json"], 5000);
    expect(results[0].ok).toBe(false);
    if (!results[0].ok) {
      expect(results[0].error).toBe("Failed to fetch");
    }
  });

  it("fetches multiple feeds in parallel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validFeedJson),
      }),
    );

    const results = await fetchFeeds(
      ["https://a.com/feed.json", "https://b.com/feed.json", "https://c.com/feed.json"],
      5000,
    );
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it("maps feed authors to entries when item has no authors", async () => {
    const feedWithAuthors = {
      ...validFeedJson,
      authors: [{ name: "Feed Author" }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(feedWithAuthors),
      }),
    );

    const results = await fetchFeeds(["https://test.com/feed.json"], 5000);
    if (results[0].ok) {
      expect(results[0].entries[0].authors).toEqual([{ name: "Feed Author" }]);
    }
  });
});
