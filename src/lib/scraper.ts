// ─── Web Scraper ────────────────────────────────────────────
// TypeScript port of DrapeNet's scraper.py
// Product URL extraction + live retailer search.

import type { RecommendedItem } from "./agents/types";

// ─── Product Page Scraper ───────────────────────────────────

export interface ScrapedProduct {
  title: string;
  imageUrl: string;
}

/**
 * Fetches a product page and extracts the og:image and og:title metadata.
 * Works with most e-commerce sites that implement Open Graph tags.
 */
export async function extractProductInfo(
  url: string
): Promise<ScrapedProduct | null> {
  console.log(`[Scraper] Fetching URL: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      console.warn(`[Scraper] HTTP ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Extract og:image
    const ogImageMatch = html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i
    ) || html.match(
      /content="([^"]+)"\s+(?:property|name)="og:image"/i
    );
    const imageUrl = ogImageMatch?.[1] || null;

    // Extract og:title or <title>
    const ogTitleMatch = html.match(
      /<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i
    ) || html.match(
      /content="([^"]+)"\s+(?:property|name)="og:title"/i
    );
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title =
      ogTitleMatch?.[1] || titleMatch?.[1]?.trim() || "Unknown Product";

    if (!imageUrl) {
      console.warn("[Scraper] No image found on page.");
      return null;
    }

    console.log(`[Scraper] Successfully extracted: ${title}`);
    return { title, imageUrl };
  } catch (error) {
    console.warn(`[Scraper] Error: ${error}`);
    return null;
  }
}

// ─── Live Retailer Search ───────────────────────────────────

/**
 * Checks whether a product title shares meaningful keywords with the query.
 * Prevents returning irrelevant results (e.g. jacket when user asked for shirt).
 */
function titleMatchesQuery(title: string, query: string): boolean {
  const fillerWords = new Set([
    "a", "an", "the", "for", "and", "or", "buy", "i", "want", "to",
    "me", "my", "new", "best", "cheap", "mens", "womens", "men", "women",
  ]);

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !fillerWords.has(w));
  const titleLower = title.toLowerCase();

  return queryWords.some((word) => titleLower.includes(word));
}

/**
 * Searches Snitch API for matching products.
 */
async function searchSnitch(query: string): Promise<RecommendedItem[]> {
  const safeQuery = query.replace(/ /g, "+");
  const url = `https://www.snitch.co.in/search/suggest.json?q=${safeQuery}&resources[type]=product`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products =
      data?.resources?.results?.products || [];

    return products.slice(0, 5).map(
      (p: { image?: string; title?: string; id?: number }) => {
        let imgUrl = p.image || "";
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

        return {
          itemId: `snitch_${p.id || "unknown"}`,
          title: p.title || "Snitch Garment",
          imageUrl: imgUrl,
          pageContent: `A trendy ${p.title || "garment"} from Snitch.`,
        };
      }
    ).filter((item: RecommendedItem) => item.imageUrl);
  } catch (error) {
    console.warn(`[Scraper] Snitch search failed: ${error}`);
    return [];
  }
}

/**
 * Searches multiple live retailers and returns relevant candidates.
 * Items whose title matches the query are ranked first.
 */
export async function searchLiveRetailer(
  query: string,
  maxResults = 8
): Promise<RecommendedItem[]> {
  console.log(`[Scraper] Live searching for: ${query}`);

  const allCandidates: RecommendedItem[] = [];
  const seenIds = new Set<string>();

  // Search Snitch (reliable JSON API)
  try {
    console.log("[Scraper] Attempting Snitch...");
    const results = await searchSnitch(query);
    if (results.length > 0) {
      console.log(`[Scraper] Got ${results.length} candidates from Snitch`);
      for (const item of results) {
        if (!seenIds.has(item.itemId)) {
          seenIds.add(item.itemId);
          allCandidates.push(item);
        }
      }
    }
  } catch (error) {
    console.warn(`[Scraper] Snitch error: ${error}`);
  }

  if (allCandidates.length === 0) {
    console.warn("[Scraper] All live search attempts returned empty.");
    return [];
  }

  // Sort: relevant items first, then the rest
  const relevant = allCandidates.filter((c) =>
    titleMatchesQuery(c.title, query)
  );
  const nonRelevant = allCandidates.filter(
    (c) => !titleMatchesQuery(c.title, query)
  );

  const ranked = [...relevant, ...nonRelevant];
  const final = ranked.slice(0, maxResults);

  console.log(
    `[Scraper] Returning ${final.length} items (${relevant.length} relevant)`
  );
  return final;
}
