/* eslint-disable prefer-const */
// ─── Web Scraper ────────────────────────────────────────────
// TypeScript port of DrapeNet's scraper.py
// Product URL extraction + live retailer search + Google Lens
// price comparison. Includes retry logic for resilience.

import type { RecommendedItem } from "./agents/types";

// ─── Retry Helper ───────────────────────────────────────────

/**
 * Wraps a fetch call with exponential backoff retry logic.
 * Retries on network errors and 5xx server errors.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(15000),
      });

      // Retry on server errors (5xx), but not client errors (4xx)
      if (response.status >= 500) {
        lastError = new Error(`Server error: HTTP ${response.status}`);
        if (attempt < maxRetries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(
            `[Scraper] Attempt ${attempt + 1}/${maxRetries} failed (HTTP ${response.status}), retrying in ${delay}ms...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(
          `[Scraper] Attempt ${attempt + 1}/${maxRetries} failed (${lastError.message}), retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// ─── Google Lens Reverse Image Search ───────────────────────

export interface PriceComparison {
  retailer: string;
  price: string | number | Float32Array | null;
  url: string;
}

/**
 * Performs a reverse image search via Google Lens to find visual matches
 * and extract price comparison data from retailers.
 * Parses the obfuscated AF_initDataCallback JSON from the Lens page.
 */
export async function runGoogleLensSearch(
  imageUrl: string
): Promise<PriceComparison[]> {
  console.log(`[Lens Engine] Initiating visual search for: ${imageUrl}`);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.google.com/",
  };

  const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
  const results: PriceComparison[] = [];

  try {
    const res = await fetchWithRetry(lensUrl, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[Lens Engine] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Google hides the visual match data in a script tag
    const match = html.match(
      /AF_initDataCallback\(\{key: 'ds:1', [\s\S]*?data: (\[[\s\S]*?\]), sideChannel: /
    );

    if (match) {
      const rawData = match[1];
      let data: unknown;
      try {
        data = JSON.parse(rawData);
      } catch {
        console.warn("[Lens Engine] Failed to parse JSON payload");
        return [];
      }

      // Recursively extract shopping data from the nested structure
      function extractShoppingData(obj: unknown): void {
        if (!Array.isArray(obj)) return;

        if (
          obj.length > 10 &&
          typeof obj[3] === "string" &&
          typeof obj[5] === "string" &&
          (obj[5] as string).startsWith("http")
        ) {
          if (!(obj[5] as string).includes("google.com")) {
            const link = obj[5] as string;
            const domain =
              obj.length > 14 && obj[14]
                ? String(obj[14])
                : "Retailer";

            let priceVal: number | null = null;
            for (const item of obj) {
              if (typeof item === "string" && item.includes("$")) {
                try {
                  const cleanPrice = item.replace(/[^\d.]/g, "");
                  const parsed = parseFloat(cleanPrice);
                  if (!isNaN(parsed) && parsed > 0) {
                    priceVal = parsed;
                    break;
                  }
                } catch {
                  // skip
                }
              }
            }

            results.push({
              retailer: domain,
              price: priceVal,
              url: link,
            });
          }
        } else {
          for (const item of obj) {
            extractShoppingData(item);
          }
        }
      }

      extractShoppingData(data);

      // Deduplicate by URL and limit to 4 results
      const seenUrls = new Set<string>();
      const uniqueResults: PriceComparison[] = [];
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          uniqueResults.push(r);
        }
        if (uniqueResults.length >= 4) break;
      }

      console.log(
        `[Lens Engine] Successfully extracted ${uniqueResults.length} visual matches!`
      );
      return uniqueResults;
    }
  } catch (error) {
    console.warn(`[Lens Engine] Error querying Google Lens: ${error}`);
  }

  return [];
}

// ─── Product Page Scraper ───────────────────────────────────

export interface ScrapedProduct {
  title: string;
  imageUrl: string;
  price?: string | number | Float32Array;
  rating?: string | number | Float32Array;
  priceComparisons?: PriceComparison[];
}

/**
 * Fetches a product page and extracts the og:image and og:title metadata.
 * Also runs Google Lens reverse image search for price comparisons.
 * Works with most e-commerce sites that implement Open Graph tags.
 */
export async function extractProductInfo(
  url: string
): Promise<ScrapedProduct | null> {
  console.log(`[Scraper] Fetching URL: ${url}`);

  try {
    const response = await fetchWithRetry(url, {
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

    let extractedPrice: number | undefined;
    let extractedRating: number | undefined;

    // Try Myntra specific extraction if it's a Myntra URL
    if (url.includes('myntra.com')) {
      const scriptMatch = html.match(/<script[^>]*>([\s\S]*?window\.__myx\s*=\s*[\s\S]*?)<\/script>/);
      if (scriptMatch) {
        let scriptContent = scriptMatch[1];
        let startIndex = scriptContent.indexOf("window.__myx = ") + "window.__myx = ".length;
        let dataStr = scriptContent.substring(startIndex);
        let endIndex = dataStr.indexOf("};");
        if (endIndex > -1) {
          dataStr = dataStr.substring(0, endIndex + 1);
        }
        try {
          const data = JSON.parse(dataStr);
          if (data?.pdpData?.price?.mrp) {
            extractedPrice = data.pdpData.price.discounted || data.pdpData.price.mrp;
          }
          if (data?.pdpData?.ratings?.averageRating) {
            extractedRating = data.pdpData.ratings.averageRating;
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) { }
      }
    }

    // Extract og:image
    const ogImageMatch =
      html.match(
        /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i
      ) ||
      html.match(
        /content="([^"]+)"\s+(?:property|name)="og:image"/i
      );
    const imageUrl = ogImageMatch?.[1] || null;

    // Extract og:title or <title>
    const ogTitleMatch =
      html.match(
        /<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i
      ) ||
      html.match(
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

    // Run Google Lens for price comparisons (non-blocking — don't fail if Lens fails)
    let priceComparisons: PriceComparison[] = [];
    try {
      priceComparisons = await runGoogleLensSearch(imageUrl);
    } catch (error) {
      console.warn(`[Scraper] Google Lens search failed: ${error}`);
    }

    return { title, imageUrl, price: extractedPrice, rating: extractedRating, priceComparisons };
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
    const res = await fetchWithRetry(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products =
      data?.resources?.results?.products || [];

    return products.slice(0, 5).map(
      (p: { image?: string; title?: string; id?: number; price?: string | number | Float32Array }) => {
        let imgUrl = p.image || "";
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;

        return {
          itemId: `snitch_${p.id || "unknown"}`,
          title: p.title || "Snitch Garment",
          imageUrl: imgUrl,
          pageContent: `A trendy ${p.title || "garment"} from Snitch.`,
          price: p.price ? Number(p.price) : undefined,
        };
      }
    ).filter((item: RecommendedItem) => item.imageUrl);
  } catch (error) {
    console.warn(`[Scraper] Snitch search failed: ${error}`);
    return [];
  }
}

/**
 * Searches Myntra for matching products by parsing the window.__myx JSON.
 * Includes retry logic for resilience against rate limiting.
 */
async function searchMyntra(query: string): Promise<RecommendedItem[]> {
  const safeQuery = query
    .replace(/ /g, "-")
    .replace(/'/g, "")
    .replace(/"/g, "");
  const url = `https://www.myntra.com/${safeQuery}`;

  try {
    const res = await fetchWithRetry(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(12000),
      },
      3, // maxRetries
      1500 // slightly longer base delay for Myntra
    );

    if (!res.ok) {
      console.warn(`[Scraper] Myntra returned HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Myntra stores product data in window.__myx = {...};
    const scriptMatch = html.match(/<script[^>]*>([\s\S]*?window\.__myx\s*=\s*[\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.warn("[Scraper] Myntra: Could not find product data script");
      return [];
    }

    let scriptContent = scriptMatch[1];
    let startIndex = scriptContent.indexOf("window.__myx = ") + "window.__myx = ".length;
    let dataStr = scriptContent.substring(startIndex);
    let endIndex = dataStr.indexOf("};");
    if (endIndex > -1) {
      dataStr = dataStr.substring(0, endIndex + 1);
    }

    let data: {
      searchData?: {
        results?: {
          products?: Array<{
            searchImage?: string;
            brand?: string;
            productName?: string;
            productId?: number;
            price?: string | number | Float32Array;
            rating?: string | number | Float32Array;
          }>;
        };
      };
    };
    try {
      data = JSON.parse(dataStr);
    } catch {
      console.warn("[Scraper] Myntra: Failed to parse product JSON");
      return [];
    }

    const products =
      data?.searchData?.results?.products || [];

    const results: RecommendedItem[] = [];
    for (const p of products.slice(0, 5)) {
      const imgUrl = p.searchImage;
      const title = `${p.brand || ""} ${p.productName || ""}`.trim();
      const itemId = p.productId || "unknown";

      if (imgUrl && title) {
        results.push({
          itemId: `myntra_${itemId}`,
          title,
          imageUrl: imgUrl,
          pageContent: `A brand new ${title} found via live web search on Myntra.`,
          price: p.price,
          rating: p.rating,
        });
      }
    }

    return results;
  } catch (error) {
    console.warn(`[Scraper] Myntra search failed: ${error}`);
    return [];
  }
}

/**
 * Searches multiple live retailers and returns relevant candidates.
 * Retailers are searched in randomized order (like the Python version).
 * Items whose title matches the query are ranked first.
 */
export async function searchLiveRetailer(
  query: string,
  maxResults = 8
): Promise<RecommendedItem[]> {
  console.log(`[Scraper] Live searching for: ${query}`);

  const allCandidates: RecommendedItem[] = [];
  const seenIds = new Set<string>();

  // Randomize retailer order (matches Python's random.shuffle)
  const retailers: [string, (q: string) => Promise<RecommendedItem[]>][] = [
    ["Snitch", searchSnitch],
    ["Myntra", searchMyntra],
  ];

  // Fisher-Yates shuffle
  for (let i = retailers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [retailers[i], retailers[j]] = [retailers[j], retailers[i]];
  }

  for (const [name, searchFn] of retailers) {
    console.log(`[Scraper] Attempting ${name}...`);
    try {
      const results = await searchFn(query);
      if (results.length > 0) {
        console.log(
          `[Scraper] Got ${results.length} candidates from ${name}`
        );
        for (const item of results) {
          if (!seenIds.has(item.itemId)) {
            seenIds.add(item.itemId);
            allCandidates.push(item);
          }
        }
      }
    } catch (error) {
      console.warn(`[Scraper] ${name} Search Failed: ${error}`);
      continue;
    }
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
    `[Scraper] Returning ${final.length} items (${relevant.length} relevant, ${nonRelevant.length} fallback)`
  );
  return final;
}
