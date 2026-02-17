import type { MergedEntry } from "../core/types.js";

export interface RenderOptions {
  showImages: boolean;
  showTags: boolean;
  showAuthors: boolean;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderCard(entry: MergedEntry, options: RenderOptions): string {
  const parts: string[] = [];

  if (options.showImages && entry.image) {
    parts.push(
      `<img class="webring-thumb" src="${escapeHtml(entry.image)}" alt="" loading="lazy">`,
    );
  }

  parts.push(
    `<h3 class="webring-title"><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.title)}</a></h3>`,
  );

  if (options.showTags && entry.tags.length > 0) {
    const tags = entry.tags
      .map((t) => `<span class="webring-tag">${escapeHtml(t)}</span>`)
      .join("");
    parts.push(`<div class="webring-tags">${tags}</div>`);
  }

  if (entry.summary) {
    parts.push(
      `<p class="webring-summary">${escapeHtml(entry.summary)}</p>`,
    );
  }

  const metaParts: string[] = [];

  if (options.showAuthors && entry.authors.length > 0) {
    const author = entry.authors[0];
    if (author.avatar) {
      metaParts.push(
        `<img class="webring-author-avatar" src="${escapeHtml(author.avatar)}" alt="">`,
      );
    }
    if (author.name) {
      metaParts.push(`<span>${escapeHtml(author.name)}</span>`);
    }
  }

  if (entry.feedTitle) {
    metaParts.push(
      `<span class="webring-feed-source">via ${escapeHtml(entry.feedTitle)}</span>`,
    );
  }

  if (metaParts.length > 0) {
    parts.push(`<div class="webring-meta">${metaParts.join("")}</div>`);
  }

  return `<article class="webring-card" data-entry-url="${escapeHtml(entry.url)}">${parts.join("")}</article>`;
}

export function renderEntries(
  entries: MergedEntry[],
  options: RenderOptions,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement("div");
  wrapper.className = "webring-grid";
  wrapper.innerHTML = entries.map((e) => renderCard(e, options)).join("");
  fragment.appendChild(wrapper);
  return fragment;
}

export function renderLoading(): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const el = document.createElement("div");
  el.className = "webring-loading";
  el.textContent = "Loading webring\u2026";
  fragment.appendChild(el);
  return fragment;
}

export function renderError(message: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const el = document.createElement("div");
  el.className = "webring-error";
  el.textContent = message;
  fragment.appendChild(el);
  return fragment;
}

export function renderEmpty(): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const el = document.createElement("div");
  el.className = "webring-empty";
  el.textContent = "No entries found.";
  fragment.appendChild(el);
  return fragment;
}
