# webring-widget

An embeddable web component that fetches, merges, and displays entries from multiple [JSON Feed](https://jsonfeed.org/version/1.1/) sources as styled cards. Drop a `<webring-widget>` tag into any page and point it at one or more feed URLs — it handles fetching, deduplication, sorting, filtering, caching, and rendering inside a Shadow DOM with full CSS theming support.

17 KB (ESM) / 23 KB (IIFE). Zero runtime dependencies.

## Quick start

### CDN / script tag

```html
<script src="https://your-cdn.example.com/webring-widget.iife.js"></script>

<webring-widget
  sources="https://alice.example.com/feed.json,https://bob.example.com/feed.json"
></webring-widget>
```

### ES module

```html
<script type="module">
  import "https://your-cdn.example.com/webring-widget.esm.js";
</script>

<webring-widget
  sources="https://alice.example.com/feed.json,https://bob.example.com/feed.json"
></webring-widget>
```

### npm

```bash
npm install webring-widget
```

```js
import "webring-widget";

// or, import the class for programmatic use:
import { WebringWidget } from "webring-widget";
```

## Creating a feed

Publishers host a static JSON file that follows [JSON Feed 1.1](https://jsonfeed.org/version/1.1/) with a `_webring` extension. The file can be served from any static host, CMS, or build pipeline.

### Minimal example

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Site",
  "_webring": { "version": "1.0" },
  "items": [
    {
      "id": "unique-id-1",
      "url": "https://mysite.example.com/post-1",
      "title": "My First Post"
    }
  ]
}
```

### Full example

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "Alice's Digital Garden",
  "home_page_url": "https://alice.example.com",
  "description": "Thoughts on web standards and the open web",
  "icon": "https://alice.example.com/icon.png",
  "language": "en",
  "authors": [
    {
      "name": "Alice Chen",
      "url": "https://alice.example.com",
      "avatar": "https://alice.example.com/avatar.jpg"
    }
  ],
  "_webring": {
    "version": "1.0",
    "tags": ["web", "accessibility"]
  },
  "items": [
    {
      "id": "post-1",
      "url": "https://alice.example.com/web-components",
      "title": "Web Components in 2025",
      "summary": "After years of framework churn, web components have quietly become the standard.",
      "image": "https://alice.example.com/img/web-components.jpg",
      "date_published": "2025-12-15T10:00:00Z",
      "authors": [{ "name": "Alice Chen" }],
      "tags": ["web-components", "standards"]
    }
  ]
}
```

### Feed schema reference

**Feed-level fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | string | yes | Must be `"https://jsonfeed.org/version/1.1"` |
| `title` | string | yes | Feed title, shown as source attribution on cards |
| `home_page_url` | string | no | URL of the site this feed represents |
| `description` | string | no | Brief description of the feed |
| `icon` | string | no | URL to a feed icon |
| `authors` | Author[] | no | Default authors for items that don't specify their own |
| `language` | string | no | BCP 47 language tag |
| `_webring` | object | yes | `{ version: string, tags?: string[] }` |
| `items` | Item[] | yes | Array of feed items |

**Item-level fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique identifier for the item |
| `url` | string | yes | Permalink to the content |
| `title` | string | yes | Item title |
| `summary` | string | no | Short description (rendered on the card) |
| `content_text` | string | no | Full text content (used as summary fallback) |
| `image` | string | no | Thumbnail/hero image URL |
| `date_published` | string | no | ISO 8601 date; used for sorting |
| `date_modified` | string | no | ISO 8601 date of last modification |
| `authors` | Author[] | no | Overrides feed-level authors for this item |
| `tags` | string[] | no | Used for filtering |

**Author fields:** `name?`, `url?`, `avatar?` (all strings, all optional).

## HTML attributes

All configuration is done through HTML attributes on `<webring-widget>`:

```html
<webring-widget
  sources="url1,url2,url3"
  max-items="25"
  sort-by="date"
  sort-order="desc"
  tags=""
  show-images="true"
  show-tags="true"
  show-authors="true"
  loading="lazy"
  cache-ttl="300"
  columns="0"
  fetch-timeout="5000"
></webring-widget>
```

| Attribute | Default | Description |
|---|---|---|
| `sources` | `""` | Comma-separated feed URLs |
| `max-items` | `25` | Maximum number of entries to display |
| `sort-by` | `"date"` | Sort mode: `date`, `title`, or `random` |
| `sort-order` | `"desc"` | Sort direction: `asc` or `desc` |
| `tags` | `""` | Comma-separated tag filter (entries must match at least one) |
| `show-images` | `"true"` | Show thumbnail images on cards |
| `show-tags` | `"true"` | Show tag chips on cards |
| `show-authors` | `"true"` | Show author name and avatar |
| `loading` | `"lazy"` | `lazy` (IntersectionObserver) or `eager` |
| `cache-ttl` | `300` | Seconds to cache feed responses; `0` disables cache |
| `columns` | `0` | Fixed column count; `0` = responsive auto-fit |
| `fetch-timeout` | `5000` | Per-feed fetch timeout in milliseconds |

Changing any attribute at runtime re-renders the widget. Changing `sources` triggers a fresh fetch; changing sort/filter/display attributes re-renders from cache.

## JavaScript API

```js
const widget = document.querySelector("webring-widget");

// Properties
widget.sources;          // string[] — current feed URLs
widget.sources = ["url1", "url2"]; // set new sources (triggers fetch)
widget.entries;          // ReadonlyArray<MergedEntry> — current rendered entries
widget.errors;           // ReadonlyArray<{ url, error }> — failed feeds from last load

// Methods
await widget.refresh();  // clear cache and re-fetch all sources
widget.filterByTags(["rust", "css"]); // shorthand for setting the tags attribute
```

## Events

All events bubble and are composed (cross Shadow DOM boundaries).

| Event | `detail` | When |
|---|---|---|
| `webring:load` | `{ entries: MergedEntry[], errors: { url, error }[] }` | After all feeds resolve and entries render |
| `webring:error` | `{ url: string, error: string }` | Once per failed feed |
| `webring:entry-click` | `{ url: string, entry: MergedEntry }` | When a card is clicked |

```js
document.querySelector("webring-widget")
  .addEventListener("webring:load", (e) => {
    console.log(`Loaded ${e.detail.entries.length} entries`);
    if (e.detail.errors.length) {
      console.warn("Some feeds failed:", e.detail.errors);
    }
  });
```

## Theming with CSS custom properties

The widget renders in Shadow DOM, so page styles don't leak in. You style it by setting CSS custom properties on the element (or any ancestor). Every visual aspect has a corresponding property with a sensible default.

### Dark theme example

```css
.dark-theme {
  --webring-card-bg: #1e1e2e;
  --webring-card-border: 1px solid #333;
  --webring-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --webring-card-shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.5);
  --webring-title-color: #e0e0e0;
  --webring-summary-color: #a0a0b0;
  --webring-author-color: #888;
  --webring-tag-bg: #2a2a3e;
  --webring-tag-color: #7ec8e3;
  --webring-loading-color: #888;
  --webring-empty-color: #888;
}
```

```html
<webring-widget class="dark-theme" sources="..."></webring-widget>
```

### Full property reference

**Layout:**

| Property | Default | Description |
|---|---|---|
| `--webring-columns` | `auto-fill` | Grid column count (set via `columns` attr or CSS) |
| `--webring-gap` | `1rem` | Gap between cards |
| `--webring-max-width` | `1200px` | Max width of the widget |
| `--webring-padding` | `0` | Outer padding |

**Card:**

| Property | Default | Description |
|---|---|---|
| `--webring-card-bg` | `#fff` | Card background |
| `--webring-card-border` | `1px solid #e0e0e0` | Card border |
| `--webring-card-radius` | `8px` | Card border radius |
| `--webring-card-shadow` | `0 1px 3px rgba(0,0,0,0.08)` | Card shadow |
| `--webring-card-shadow-hover` | `0 4px 12px rgba(0,0,0,0.12)` | Card shadow on hover |
| `--webring-card-padding` | `1rem` | Card inner padding |

**Typography:**

| Property | Default | Description |
|---|---|---|
| `--webring-font-family` | `system-ui, -apple-system, sans-serif` | Base font |
| `--webring-title-size` | `1.1rem` | Title font size |
| `--webring-title-weight` | `600` | Title font weight |
| `--webring-title-color` | `#111` | Title text color |
| `--webring-summary-size` | `0.9rem` | Summary font size |
| `--webring-summary-color` | `#555` | Summary text color |
| `--webring-author-size` | `0.8rem` | Author/meta font size |
| `--webring-author-color` | `#777` | Author/meta text color |

**Thumbnail:**

| Property | Default | Description |
|---|---|---|
| `--webring-thumb-height` | `180px` | Image height |
| `--webring-thumb-object-fit` | `cover` | Image fit mode |
| `--webring-thumb-radius` | `4px` | Image border radius |

**Tags:**

| Property | Default | Description |
|---|---|---|
| `--webring-tag-bg` | `#f0f0f0` | Tag chip background |
| `--webring-tag-color` | `#555` | Tag chip text color |
| `--webring-tag-radius` | `12px` | Tag chip border radius |

**States:**

| Property | Default | Description |
|---|---|---|
| `--webring-loading-color` | `#888` | Loading message color |
| `--webring-error-color` | `#c00` | Error message color |
| `--webring-empty-color` | `#888` | Empty state color |

## Error resilience

The widget fetches all sources in parallel. If some feeds fail (network error, timeout, invalid format, HTTP error), the widget still renders entries from the feeds that succeeded. Failed feeds are reported via `webring:error` events and available through the `.errors` property.

```html
<!-- Two good feeds + one broken URL — widget renders the good ones -->
<webring-widget
  sources="good1.json,DOES_NOT_EXIST.json,good2.json"
></webring-widget>
```

## How it works

1. The widget fetches all `sources` URLs in parallel, each with its own `AbortController` and per-feed timeout.
2. Responses are validated against the JSON Feed schema using runtime type guards.
3. Valid entries are merged, deduplicated (by normalized URL), filtered by tags, sorted, and capped at `max-items`.
4. A `DocumentFragment` of card elements is rendered into the Shadow DOM.
5. Results are cached in memory for `cache-ttl` seconds. Changing sort/filter/display attributes re-renders from cache without re-fetching.

## Architecture

```
src/core/       Pure data: fetch, validate, merge, deduplicate. Zero DOM deps.
                This is the seam where Rust/WASM would plug in later.

src/component/  Shadow DOM rendering + Web Component lifecycle.
                Depends on core/ via a DataLayer interface.
```

The `DataLayer` interface in `src/core/types.ts` defines the contract between the component and data layer, making it straightforward to swap in a WASM implementation later without touching any rendering code.

## Development

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:3000/demo/
npm run build        # produce dist/webring-widget.{esm,iife}.js
npm run typecheck    # run tsc --noEmit
npm test             # run vitest
npm run test:watch   # run vitest in watch mode
```

### Project structure

```
src/
  index.ts                     Entry point — registers <webring-widget>, re-exports public API
  schema/
    feed.ts                    TypeScript interfaces (Feed, FeedItem, Author, WebringExtension)
    validate.ts                Runtime type guards — validateFeed(), isFeedItem(), isAuthor()
  core/
    types.ts                   MergedEntry, FetchResult, DataLayer interface, sort/filter options
    fetcher.ts                 Parallel fetch with per-feed AbortController + timeout
    merger.ts                  Deduplicate, sort, filter, cap
  component/
    webring-widget.ts          Custom Element class — lifecycle, attributes, events, cache
    renderer.ts                Pure function: entries -> DocumentFragment of card HTML
    styles.css                 Shadow DOM stylesheet (inlined as string at build time)
  utils/
    url.ts                     URL normalization for deduplication
demo/
  index.html                   Showcase page with multiple widget configurations
  demo.css                     Demo page styles
  feeds/                       Sample JSON feeds (alice.json, bob.json, carol.json)
test/
  validate.test.ts             Schema validation tests
  url.test.ts                  URL normalization tests
  fetcher.test.ts              Fetcher tests (mocked fetch)
  merger.test.ts               Merge/dedup/sort/filter tests
  component.test.ts            Web component integration tests (happy-dom)
```

### Build tooling

- **esbuild** bundles to ESM (ES2022) and IIFE (ES2020), with a CSS-as-string plugin that inlines the Shadow DOM stylesheet.
- **TypeScript** is used for type checking only (`tsc --noEmit`); esbuild handles compilation.
- **vitest** with `happy-dom` for unit and component tests.

## CORS

Feed URLs are fetched client-side with `fetch()`. The servers hosting feed JSON files must serve them with appropriate CORS headers (`Access-Control-Allow-Origin`) if the feeds are on a different origin than the page embedding the widget.

For simple static file hosting, most CDNs and platforms (Netlify, Vercel, Cloudflare Pages, GitHub Pages) serve static files with permissive CORS headers by default. If you host feeds on your own server, you may need to configure it:

```
Access-Control-Allow-Origin: *
```

## License

MIT
