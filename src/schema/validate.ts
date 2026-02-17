import type { Feed, FeedItem, Author, WebringExtension } from "./feed.js";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === "string";
}

export function isAuthor(v: unknown): v is Author {
  if (!isObject(v)) return false;
  return (
    isOptionalString(v.name) &&
    isOptionalString(v.url) &&
    isOptionalString(v.avatar)
  );
}

export function isWebringExtension(v: unknown): v is WebringExtension {
  if (!isObject(v)) return false;
  if (typeof v.version !== "string") return false;
  if (v.tags !== undefined) {
    if (!Array.isArray(v.tags) || !v.tags.every((t) => typeof t === "string"))
      return false;
  }
  return true;
}

export function isFeedItem(v: unknown): v is FeedItem {
  if (!isObject(v)) return false;
  if (typeof v.id !== "string" || v.id === "") return false;
  if (typeof v.url !== "string" || v.url === "") return false;
  if (typeof v.title !== "string") return false;

  if (!isOptionalString(v.summary)) return false;
  if (!isOptionalString(v.content_text)) return false;
  if (!isOptionalString(v.image)) return false;
  if (!isOptionalString(v.date_published)) return false;
  if (!isOptionalString(v.date_modified)) return false;

  if (v.authors !== undefined) {
    if (!Array.isArray(v.authors) || !v.authors.every(isAuthor)) return false;
  }
  if (v.tags !== undefined) {
    if (!Array.isArray(v.tags) || !v.tags.every((t) => typeof t === "string"))
      return false;
  }
  return true;
}

export function validateFeed(v: unknown): v is Feed {
  if (!isObject(v)) return false;
  if (typeof v.version !== "string") return false;
  if (typeof v.title !== "string") return false;
  if (!isOptionalString(v.home_page_url)) return false;
  if (!isOptionalString(v.description)) return false;
  if (!isOptionalString(v.icon)) return false;
  if (!isOptionalString(v.language)) return false;

  if (v.authors !== undefined) {
    if (!Array.isArray(v.authors) || !v.authors.every(isAuthor)) return false;
  }

  if (!isObject(v._webring) || !isWebringExtension(v._webring)) return false;

  if (!Array.isArray(v.items) || !v.items.every(isFeedItem)) return false;

  return true;
}
