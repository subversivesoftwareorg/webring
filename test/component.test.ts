import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to stub fetch before importing the component
const validFeedJson = {
  version: "https://jsonfeed.org/version/1.1",
  title: "Test Feed",
  _webring: { version: "1.0" },
  items: [
    {
      id: "1",
      url: "https://example.com/post-1",
      title: "Test Post",
      summary: "A test summary",
      tags: ["test", "web"],
      authors: [{ name: "Tester" }],
    },
    {
      id: "2",
      url: "https://example.com/post-2",
      title: "Another Post",
      summary: "Another summary",
      image: "https://example.com/img.jpg",
      date_published: "2025-06-01T00:00:00Z",
      tags: ["web"],
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(validFeedJson),
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any widgets from the DOM
  document.body.innerHTML = "";
});

describe("WebringWidget", () => {
  async function createWidget(attrs: Record<string, string> = {}): Promise<HTMLElement> {
    // Dynamically import to get the side-effect registration
    await import("../src/index");

    const el = document.createElement("webring-widget");
    el.setAttribute("loading", "eager");
    el.setAttribute("cache-ttl", "0");
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    document.body.appendChild(el);

    // Wait for async load to complete
    await new Promise((r) => setTimeout(r, 50));
    return el;
  }

  it("registers the custom element", async () => {
    await import("../src/index");
    expect(customElements.get("webring-widget")).toBeDefined();
  });

  it("renders cards from a feed source", async () => {
    const widget = await createWidget({ sources: "https://test.com/feed.json" });
    const shadow = widget.shadowRoot!;
    const cards = shadow.querySelectorAll(".webring-card");
    expect(cards.length).toBe(2);
  });

  it("renders entry titles as links", async () => {
    const widget = await createWidget({ sources: "https://test.com/feed.json" });
    const shadow = widget.shadowRoot!;
    const titles = shadow.querySelectorAll(".webring-title a");
    expect(titles.length).toBe(2);
    // "Another Post" has a date, so it sorts first (desc by date)
    expect(titles[0].textContent).toBe("Another Post");
    expect(titles[0].getAttribute("href")).toBe("https://example.com/post-2");
  });

  it("renders tags", async () => {
    const widget = await createWidget({ sources: "https://test.com/feed.json" });
    const shadow = widget.shadowRoot!;
    const tags = shadow.querySelectorAll(".webring-tag");
    expect(tags.length).toBeGreaterThan(0);
  });

  it("hides tags when show-tags=false", async () => {
    const widget = await createWidget({
      sources: "https://test.com/feed.json",
      "show-tags": "false",
    });
    const shadow = widget.shadowRoot!;
    const tags = shadow.querySelectorAll(".webring-tag");
    expect(tags.length).toBe(0);
  });

  it("hides images when show-images=false", async () => {
    const widget = await createWidget({
      sources: "https://test.com/feed.json",
      "show-images": "false",
    });
    const shadow = widget.shadowRoot!;
    const thumbs = shadow.querySelectorAll(".webring-thumb");
    expect(thumbs.length).toBe(0);
  });

  it("shows empty state when no sources given", async () => {
    const widget = await createWidget({});
    const shadow = widget.shadowRoot!;
    const empty = shadow.querySelector(".webring-empty");
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toContain("No entries");
  });

  it("exposes entries via JS API", async () => {
    const widget = await createWidget({ sources: "https://test.com/feed.json" }) as any;
    expect(widget.entries.length).toBe(2);
  });

  it("exposes sources as array via JS API", async () => {
    const widget = await createWidget({ sources: "https://a.com,https://b.com" }) as any;
    expect(widget.sources).toEqual(["https://a.com", "https://b.com"]);
  });

  it("dispatches webring:load event", async () => {
    const handler = vi.fn();
    await import("../src/index");
    const el = document.createElement("webring-widget");
    el.setAttribute("loading", "eager");
    el.setAttribute("cache-ttl", "0");
    el.setAttribute("sources", "https://test.com/feed.json");
    el.addEventListener("webring:load", handler);
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("dispatches webring:error for failed feeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    const handler = vi.fn();
    await import("../src/index");
    const el = document.createElement("webring-widget");
    el.setAttribute("loading", "eager");
    el.setAttribute("cache-ttl", "0");
    el.setAttribute("sources", "https://broken.com/feed.json");
    el.addEventListener("webring:error", handler);
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));
    expect(handler).toHaveBeenCalled();
  });

  it("handles tag filtering via attribute", async () => {
    const widget = await createWidget({
      sources: "https://test.com/feed.json",
      tags: "test",
    });
    const shadow = widget.shadowRoot!;
    const cards = shadow.querySelectorAll(".webring-card");
    expect(cards.length).toBe(1);
  });
});
