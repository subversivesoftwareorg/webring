import type {
  MergedEntry,
  FetchResult,
  SortBy,
  SortOrder,
} from "../core/types.js";
import { fetchFeeds } from "../core/fetcher.js";
import { merge } from "../core/merger.js";
import {
  renderEntries,
  renderLoading,
  renderError,
  renderEmpty,
} from "./renderer.js";
import styles from "./styles.css";

interface CacheEntry {
  results: FetchResult[];
  timestamp: number;
}

const OBSERVED_ATTRS = [
  "sources",
  "max-items",
  "sort-by",
  "sort-order",
  "tags",
  "show-images",
  "show-tags",
  "show-authors",
  "loading",
  "cache-ttl",
  "columns",
  "fetch-timeout",
] as const;

export class WebringWidget extends HTMLElement {
  static get observedAttributes(): string[] {
    return [...OBSERVED_ATTRS];
  }

  #shadow: ShadowRoot;
  #content: HTMLDivElement;
  #style: HTMLStyleElement;
  #entries: MergedEntry[] = [];
  #errors: Array<{ url: string; error: string }> = [];
  #cache: CacheEntry | null = null;
  #observer: IntersectionObserver | null = null;
  #initialized = false;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#style = document.createElement("style");
    this.#style.textContent = styles;
    this.#content = document.createElement("div");
    this.#shadow.appendChild(this.#style);
    this.#shadow.appendChild(this.#content);
  }

  // --- Public API ---

  get sources(): string[] {
    return (this.getAttribute("sources") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  set sources(val: string[] | string) {
    this.setAttribute(
      "sources",
      Array.isArray(val) ? val.join(",") : val,
    );
  }

  get entries(): ReadonlyArray<MergedEntry> {
    return this.#entries;
  }

  get errors(): ReadonlyArray<{ url: string; error: string }> {
    return this.#errors;
  }

  async refresh(): Promise<void> {
    this.#cache = null;
    await this.#load();
  }

  filterByTags(tags: string[]): void {
    this.setAttribute("tags", tags.join(","));
  }

  // --- Attribute helpers ---

  #getAttrNumber(name: string, fallback: number): number {
    const val = this.getAttribute(name);
    if (val === null) return fallback;
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  #getAttrBool(name: string, fallback: boolean): boolean {
    const val = this.getAttribute(name);
    if (val === null) return fallback;
    return val !== "false";
  }

  get #maxItems(): number {
    return this.#getAttrNumber("max-items", 25);
  }
  get #sortBy(): SortBy {
    return (this.getAttribute("sort-by") as SortBy) ?? "date";
  }
  get #sortOrder(): SortOrder {
    return (this.getAttribute("sort-order") as SortOrder) ?? "desc";
  }
  get #tags(): string[] {
    return (this.getAttribute("tags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  get #showImages(): boolean {
    return this.#getAttrBool("show-images", true);
  }
  get #showTags(): boolean {
    return this.#getAttrBool("show-tags", true);
  }
  get #showAuthors(): boolean {
    return this.#getAttrBool("show-authors", true);
  }
  get #loadingMode(): "lazy" | "eager" {
    return this.getAttribute("loading") === "eager" ? "eager" : "lazy";
  }
  get #cacheTtl(): number {
    return this.#getAttrNumber("cache-ttl", 300);
  }
  get #columns(): number {
    return this.#getAttrNumber("columns", 0);
  }
  get #fetchTimeout(): number {
    return this.#getAttrNumber("fetch-timeout", 5000);
  }

  // --- Lifecycle ---

  connectedCallback(): void {
    this.#applyColumns();
    if (this.#loadingMode === "lazy") {
      this.#setupLazyLoad();
    } else {
      this.#load();
    }
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback(
    name: string,
    oldVal: string | null,
    newVal: string | null,
  ): void {
    if (oldVal === newVal) return;
    if (name === "columns") {
      this.#applyColumns();
    }
    if (this.#initialized) {
      // Re-render if the attribute changes meaningful state
      if (name === "sources") {
        this.#cache = null;
        this.#load();
      } else if (
        [
          "max-items",
          "sort-by",
          "sort-order",
          "tags",
          "show-images",
          "show-tags",
          "show-authors",
        ].includes(name)
      ) {
        // Re-merge from cached results if available
        if (this.#cache) {
          this.#renderFromCache();
        }
      }
    }
  }

  // --- Internal ---

  #applyColumns(): void {
    const cols = this.#columns;
    if (cols > 0) {
      this.style.setProperty("--webring-columns", String(cols));
    } else {
      this.style.removeProperty("--webring-columns");
    }
  }

  #setupLazyLoad(): void {
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.#observer?.disconnect();
          this.#observer = null;
          this.#load();
        }
      },
      { rootMargin: "200px" },
    );
    this.#observer.observe(this);
  }

  async #load(): Promise<void> {
    const urls = this.sources;
    if (urls.length === 0) {
      this.#render(renderEmpty());
      return;
    }

    // Check cache
    if (this.#cache && this.#cacheTtl > 0) {
      const age = (Date.now() - this.#cache.timestamp) / 1000;
      if (age < this.#cacheTtl) {
        this.#renderFromCache();
        return;
      }
    }

    this.#render(renderLoading());

    const results = await fetchFeeds(urls, this.#fetchTimeout);

    // Store cache
    this.#cache = { results, timestamp: Date.now() };
    this.#initialized = true;

    // Collect errors
    this.#errors = results
      .filter((r): r is Extract<FetchResult, { ok: false }> => !r.ok)
      .map((r) => ({ url: r.url, error: r.error }));

    this.#renderFromCache();

    // Dispatch events
    this.dispatchEvent(
      new CustomEvent("webring:load", {
        bubbles: true,
        composed: true,
        detail: { entries: this.#entries, errors: this.#errors },
      }),
    );

    for (const err of this.#errors) {
      this.dispatchEvent(
        new CustomEvent("webring:error", {
          bubbles: true,
          composed: true,
          detail: err,
        }),
      );
    }
  }

  #renderFromCache(): void {
    if (!this.#cache) return;

    this.#entries = merge(this.#cache.results, {
      sortBy: this.#sortBy,
      sortOrder: this.#sortOrder,
      maxItems: this.#maxItems,
      tags: this.#tags,
    });

    if (this.#entries.length === 0) {
      this.#render(renderEmpty());
      return;
    }

    const fragment = renderEntries(this.#entries, {
      showImages: this.#showImages,
      showTags: this.#showTags,
      showAuthors: this.#showAuthors,
    });

    this.#render(fragment);
    this.#attachCardClicks();
  }

  #render(content: DocumentFragment): void {
    this.#content.replaceChildren(content);
  }

  #attachCardClicks(): void {
    const cards = this.#shadow.querySelectorAll(".webring-card");
    for (const card of cards) {
      card.addEventListener("click", (e) => {
        const url = (card as HTMLElement).dataset.entryUrl;
        if (url) {
          this.dispatchEvent(
            new CustomEvent("webring:entry-click", {
              bubbles: true,
              composed: true,
              detail: { url, entry: this.#entries.find((en) => en.url === url) },
            }),
          );
        }
      });
    }
  }
}
