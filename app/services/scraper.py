import httpx
from bs4 import BeautifulSoup
import re
import json
import random
import logging

logger = logging.getLogger(__name__)

def run_custom_lens_search(image_url: str) -> list:
    """
    Performs a custom Reverse Image Search by querying Google Lens directly.
    Parses the highly obfuscated internal JSON to extract visual matches and prices.
    """
    logger.info(f"[Lens Engine] Initiating visual search for: {image_url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }
    
    lens_url = f"https://lens.google.com/uploadbyurl?url={image_url}"
    results = []
    
    try:
        with httpx.Client(follow_redirects=True) as client:
            res = client.get(lens_url, headers=headers, timeout=15.0)
        
        res.raise_for_status()
        html = res.text
        
        # Google hides the visual match data in a script tag
        match = re.search(r"AF_initDataCallback\(\{key: 'ds:1', .*?data: (\[.*?\]), sideChannel: ", html, re.DOTALL)
        
        if match:
            raw_data = match.group(1)
            data = json.loads(raw_data)
            
            def extract_shopping_data(obj):
                if isinstance(obj, list):
                    if len(obj) > 10 and isinstance(obj[3], str) and isinstance(obj[5], str) and obj[5].startswith("http"):
                        if "google.com" not in obj[5]:
                            title = obj[3]
                            link = obj[5]
                            domain = str(obj[14]) if len(obj) > 14 and obj[14] else "Retailer"
                            
                            price_val = 0.0
                            for item in obj:
                                if isinstance(item, str) and "$" in item:
                                    try:
                                        clean_price = re.sub(r'[^\d.]', '', item)
                                        price_val = float(clean_price)
                                        break
                                    except ValueError:
                                        pass
                            
                            # If no price could be parsed from the DOM, mark as
                            # unavailable rather than fabricating a random value.
                            if price_val == 0.0:
                                price_val = None
                                
                            results.append({
                                "retailer": domain,
                                "price": price_val,
                                "url": link
                            })
                    else:
                        for item in obj:
                            extract_shopping_data(item)
            
            extract_shopping_data(data)
            
            seen_urls = set()
            unique_results = []
            for r in results:
                if r["url"] not in seen_urls:
                    seen_urls.add(r["url"])
                    unique_results.append(r)
                if len(unique_results) >= 4:
                    break
                    
            logger.info(f"[Lens Engine] Successfully extracted {len(unique_results)} visual matches!")
            return unique_results
            
    except Exception as e:
        logger.warning(f"[Lens Engine] Error querying Google Lens: {e}")
        
    return []


def _title_matches_query(title: str, query: str) -> bool:
    """
    Basic relevance check: verifies that the product title shares meaningful
    keywords with the search query. This prevents the scraper from returning
    a jacket when the user asked for a tshirt.
    
    We extract significant words from the query (ignoring filler words) and
    require at least one to appear in the product title.
    """
    filler_words = {"a", "an", "the", "for", "and", "or", "buy", "i", "want", "to", "me", "my", "new", "best", "cheap", "mens", "womens", "men", "women"}
    
    query_words = set(query.lower().split()) - filler_words
    title_lower = title.lower()
    
    # Require at least one significant query keyword to appear in the title
    matches = sum(1 for word in query_words if word in title_lower)
    return matches >= 1


def search_myntra(query: str) -> list[dict]:
    """
    Searches Myntra and returns ALL matching products (up to 5) so the caller
    can pick the most relevant one.
    """
    safe_query = query.replace(" ", "-").replace("'", "").replace('"', '')
    url = f"https://www.myntra.com/{safe_query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    }
    with httpx.Client(follow_redirects=True) as client:
        res = client.get(url, headers=headers, timeout=12.0)
    res.raise_for_status()
    
    soup = BeautifulSoup(res.text, "html.parser")
    script = soup.find("script", string=re.compile("window.__myx ="))
    if not script:
        return []
        
    data_str = script.string.replace("window.__myx = ", "").split(";\n")[0]
    data = json.loads(data_str)
    products = data.get("searchData", {}).get("results", {}).get("products", [])
    
    results = []
    for p in products[:5]:
        img_url = p.get("searchImage")
        title = f"{p.get('brand', '')} {p.get('productName', '')}".strip()
        item_id = p.get("productId", "unknown")
        
        if img_url and title:
            results.append({
                "item_id": f"myntra_{item_id}",
                "title": title,
                "image_url": img_url,
                "page_content": f"A brand new {title} found via live web search on Myntra."
            })
    return results

def search_snitch(query: str) -> list[dict]:
    """
    Searches Snitch and returns ALL matching products (up to 5) so the caller
    can pick the most relevant one.
    """
    safe_query = query.replace(" ", "+")
    url = f"https://www.snitch.co.in/search/suggest.json?q={safe_query}&resources[type]=product"
    with httpx.Client(follow_redirects=True) as client:
        res = client.get(url, timeout=10.0)
    res.raise_for_status()
    
    data = res.json()
    products = data.get("resources", {}).get("results", {}).get("products", [])
    
    results = []
    for p in products[:5]:
        img_url = p.get("image")
        if img_url and img_url.startswith("//"):
            img_url = "https:" + img_url
            
        title = p.get("title", "Snitch Garment")
        item_id = str(p.get("id", "unknown"))
        
        if img_url:
            results.append({
                "item_id": f"snitch_{item_id}",
                "title": title,
                "image_url": img_url,
                "page_content": f"A trendy new {title} found via live web search on Snitch."
            })
    return results

def search_live_retailer(query: str, max_results: int = 8) -> list[dict]:
    """
    Searches multiple live retailers and returns ALL relevant candidates
    (up to max_results) so the user can swipe through them.
    
    Items whose title matches the query keywords are ranked first,
    followed by any remaining items as fallback.
    """
    logger.info(f"[Scraper] Live Searching Retailers for: {query}")
    
    retailers = [
        ("Snitch", search_snitch),
        ("Myntra", search_myntra)
    ]
    random.shuffle(retailers)
    
    all_candidates = []
    seen_ids = set()
    
    for name, search_func in retailers:
        logger.info(f"[Scraper] Attempting {name}")
        try:
            results = search_func(query)
            if results:
                logger.info(f"[Scraper] Got {len(results)} candidates from {name}")
                for item in results:
                    if item["item_id"] not in seen_ids:
                        seen_ids.add(item["item_id"])
                        all_candidates.append(item)
        except Exception as e:
            logger.warning(f"[Scraper] {name} Search Failed: {e}")
            continue
    
    if not all_candidates:
        logger.warning("[Scraper] All live search attempts failed.")
        return []
    
    # Sort: relevant items first (title matches query), then the rest
    relevant = [c for c in all_candidates if _title_matches_query(c["title"], query)]
    non_relevant = [c for c in all_candidates if not _title_matches_query(c["title"], query)]
    
    ranked = relevant + non_relevant
    final = ranked[:max_results]
    
    logger.info(f"[Scraper] Returning {len(final)} items ({len(relevant)} relevant, {len(non_relevant)} fallback)")
    return final


def extract_product_info(url: str) -> dict:
    """
    Attempts to scrape a product page to find the main garment image and title.
    """
    logger.info(f"[Scraper] Fetching URL: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    try:
        with httpx.Client(follow_redirects=True) as client:
            response = client.get(url, headers=headers, timeout=12.0)
            
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        og_image = soup.find("meta", property="og:image")
        image_url = og_image["content"] if og_image else None
        
        og_title = soup.find("meta", property="og:title")
        title = og_title["content"] if og_title else soup.title.string if soup.title else "Unknown Product"
        
        if not image_url:
            logger.warning("[Scraper] Failed: No image found on page.")
            return None
            
        logger.info(f"[Scraper] Successfully extracted: {title}")
        
        comparisons = run_custom_lens_search(image_url)
        
        return {
            "title": title,
            "image_url": image_url,
            "price_comparisons": comparisons
        }
        
    except httpx.HTTPStatusError as e:
        logger.warning(f"[Scraper] Retailer blocked request (Status {e.response.status_code})")
        return None
    except Exception as e:
        logger.warning(f"[Scraper] Network/Parsing Error: {e}")
        return None
