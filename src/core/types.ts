import type { Author } from "../schema/feed.js";

/** A feed item enriched with source metadata, ready for rendering. */
export interface MergedEntry {
  id: string;
  url: string;
  title: string;
  summary?: string;
  image?: string;
  datePublished?: Date;
  authors: Author[];
  tags: string[];
  feedTitle: string;
  feedUrl: string;
}

export interface FetchSuccess {
  ok: true;
  url: string;
  feedTitle: string;
  entries: MergedEntry[];
}

export interface FetchFailure {
  ok: false;
  url: string;
  error: string;
}

export type FetchResult = FetchSuccess | FetchFailure;

export type SortBy = "date" | "title" | "random";
export type SortOrder = "asc" | "desc";

export interface MergeOptions {
  sortBy: SortBy;
  sortOrder: SortOrder;
  maxItems: number;
  tags: string[];
}

/**
 * DataLayer interface — the seam where Rust/WASM could replace the TS implementation.
 */
export interface DataLayer {
  fetchFeeds(urls: string[], timeoutMs: number): Promise<FetchResult[]>;
  merge(results: FetchResult[], options: MergeOptions): MergedEntry[];
}
