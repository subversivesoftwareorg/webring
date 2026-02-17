import type { FetchResult, MergedEntry, MergeOptions } from "./types.js";
import { normalizeUrl } from "../utils/url.js";

/** Deduplicate entries by normalized URL, keeping the first occurrence. */
function deduplicate(entries: MergedEntry[]): MergedEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = normalizeUrl(e.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortEntries(
  entries: MergedEntry[],
  sortBy: MergeOptions["sortBy"],
  sortOrder: MergeOptions["sortOrder"],
): MergedEntry[] {
  if (sortBy === "random") {
    // Fisher-Yates shuffle
    const arr = [...entries];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const dir = sortOrder === "asc" ? 1 : -1;

  return [...entries].sort((a, b) => {
    if (sortBy === "title") {
      return dir * a.title.localeCompare(b.title);
    }
    // sort by date — entries without dates go to the end
    const da = a.datePublished?.getTime() ?? 0;
    const db = b.datePublished?.getTime() ?? 0;
    if (da === 0 && db === 0) return 0;
    if (da === 0) return 1;
    if (db === 0) return -1;
    return dir * (da - db);
  });
}

function filterByTags(entries: MergedEntry[], tags: string[]): MergedEntry[] {
  if (tags.length === 0) return entries;
  const lower = new Set(tags.map((t) => t.toLowerCase()));
  return entries.filter((e) =>
    e.tags.some((t) => lower.has(t.toLowerCase())),
  );
}

/** Merge results from multiple feeds: collect, dedup, filter, sort, cap. */
export function merge(
  results: FetchResult[],
  options: MergeOptions,
): MergedEntry[] {
  // Collect all entries from successful fetches
  let entries = results
    .filter((r): r is Extract<FetchResult, { ok: true }> => r.ok)
    .flatMap((r) => r.entries);

  entries = deduplicate(entries);
  entries = filterByTags(entries, options.tags);
  entries = sortEntries(entries, options.sortBy, options.sortOrder);

  if (options.maxItems > 0) {
    entries = entries.slice(0, options.maxItems);
  }

  return entries;
}
