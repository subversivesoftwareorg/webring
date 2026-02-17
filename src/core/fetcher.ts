import type { Feed } from "../schema/feed.js";
import type { FetchResult, MergedEntry } from "./types.js";
import { validateFeed } from "../schema/validate.js";

function toMergedEntries(feed: Feed, sourceUrl: string): MergedEntry[] {
  return feed.items.map((item) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    summary: item.summary ?? item.content_text,
    image: item.image,
    datePublished: item.date_published
      ? new Date(item.date_published)
      : undefined,
    authors: item.authors ?? feed.authors ?? [],
    tags: item.tags ?? [],
    feedTitle: feed.title,
    feedUrl: sourceUrl,
  }));
}

async function fetchSingleFeed(
  url: string,
  timeoutMs: number,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return { ok: false, url, error: `HTTP ${response.status}` };
    }
    const data: unknown = await response.json();
    if (!validateFeed(data)) {
      return { ok: false, url, error: "Invalid feed format" };
    }
    return {
      ok: true,
      url,
      feedTitle: data.title,
      entries: toMergedEntries(data, url),
    };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? `Timeout after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : "Unknown fetch error";
    return { ok: false, url, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch multiple feeds in parallel, each with its own AbortController + timeout. */
export async function fetchFeeds(
  urls: string[],
  timeoutMs: number,
): Promise<FetchResult[]> {
  return Promise.all(urls.map((url) => fetchSingleFeed(url, timeoutMs)));
}
