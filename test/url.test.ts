import { describe, it, expect } from "vitest";
import { normalizeUrl } from "../src/utils/url";

describe("normalizeUrl", () => {
  it("lowercases hostname", () => {
    expect(normalizeUrl("https://EXAMPLE.COM/path")).toBe(
      "https://example.com/path",
    );
  });

  it("strips trailing slash", () => {
    expect(normalizeUrl("https://example.com/path/")).toBe(
      "https://example.com/path",
    );
  });

  it("preserves root path slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe(
      "https://example.com/",
    );
  });

  it("removes default HTTPS port", () => {
    expect(normalizeUrl("https://example.com:443/path")).toBe(
      "https://example.com/path",
    );
  });

  it("removes default HTTP port", () => {
    expect(normalizeUrl("http://example.com:80/path")).toBe(
      "http://example.com/path",
    );
  });

  it("keeps non-default port", () => {
    expect(normalizeUrl("https://example.com:8080/path")).toBe(
      "https://example.com:8080/path",
    );
  });

  it("sorts query params", () => {
    expect(normalizeUrl("https://example.com?b=2&a=1")).toBe(
      "https://example.com/?a=1&b=2",
    );
  });

  it("removes hash", () => {
    expect(normalizeUrl("https://example.com/path#section")).toBe(
      "https://example.com/path",
    );
  });

  it("returns raw string for invalid URLs", () => {
    expect(normalizeUrl("not-a-url")).toBe("not-a-url");
  });
});
