/**
 * JSON Feed 1.1 compatible interfaces with _webring extension.
 * @see https://jsonfeed.org/version/1.1/
 */

export interface Author {
  name?: string;
  url?: string;
  avatar?: string;
}

export interface WebringExtension {
  version: string;
  tags?: string[];
}

export interface FeedItem {
  id: string;
  url: string;
  title: string;
  summary?: string;
  content_text?: string;
  image?: string;
  date_published?: string;
  date_modified?: string;
  authors?: Author[];
  tags?: string[];
}

export interface Feed {
  version: string;
  title: string;
  home_page_url?: string;
  description?: string;
  icon?: string;
  authors?: Author[];
  language?: string;
  _webring: WebringExtension;
  items: FeedItem[];
}
