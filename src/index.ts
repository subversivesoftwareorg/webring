import { WebringWidget } from "./component/webring-widget.js";

export { WebringWidget };
export type { Feed, FeedItem, Author, WebringExtension } from "./schema/feed.js";
export type {
  MergedEntry,
  FetchResult,
  DataLayer,
  SortBy,
  SortOrder,
  MergeOptions,
} from "./core/types.js";
export { validateFeed } from "./schema/validate.js";
export { fetchFeeds } from "./core/fetcher.js";
export { merge } from "./core/merger.js";

// Register the custom element
if (
  typeof customElements !== "undefined" &&
  !customElements.get("webring-widget")
) {
  customElements.define("webring-widget", WebringWidget);
}
