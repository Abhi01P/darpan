// ─── AI Service Abstraction Layer ───────────────────────────
// Factory pattern: auto-selects MockAIService or RealAIService
// based on whether OPENAI_API_KEY is present in environment.
//
// To switch to production, just add OPENAI_API_KEY to .env.

import type {
  AIResponse,
  ChatContext,
  ProductAnalysis,
  SuggestedAction,
} from "./types/ai-chat";

// ─── Interface ──────────────────────────────────────────────

interface AIService {
  chat(
    messages: { role: "user" | "assistant"; content: string }[],
    context?: ChatContext
  ): Promise<AIResponse>;
  analyzeProductUrl(url: string): Promise<ProductAnalysis>;
}

// ─── URL Detection Helper ───────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

function extractDomainHint(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("zara")) return "Zara";
    if (hostname.includes("hm") || hostname.includes("h&m")) return "H&M";
    if (hostname.includes("uniqlo")) return "Uniqlo";
    if (hostname.includes("myntra")) return "Myntra";
    if (hostname.includes("ajio")) return "AJIO";
    if (hostname.includes("nike")) return "Nike";
    if (hostname.includes("adidas")) return "Adidas";
    if (hostname.includes("asos")) return "ASOS";
    if (hostname.includes("mango")) return "Mango";
    if (hostname.includes("amazon")) return "Amazon Fashion";
    if (hostname.includes("flipkart")) return "Flipkart Fashion";
    return hostname.split(".").slice(-2, -1)[0] || "Online Store";
  } catch {
    return "Online Store";
  }
}

// ─── Mock AI Service ────────────────────────────────────────

class MockAIService implements AIService {
  private async simulateDelay(): Promise<void> {
    const delay = 800 + Math.random() * 1200;
    await new Promise((r) => setTimeout(r, delay));
  }

  async chat(
    messages: { role: "user" | "assistant"; content: string }[],
    context?: ChatContext
  ): Promise<AIResponse> {
    await this.simulateDelay();

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const urls = extractUrls(messages[messages.length - 1]?.content || "");

    // ── URL Analysis Flow
    if (urls.length > 0) {
      const productData = await this.analyzeProductUrl(urls[0]);
      return {
        reply: `I've analyzed the product from **${productData.brand}**! Here's what I found:\n\n**${productData.name}**\n\n${productData.description}\n\n**Material:** ${productData.material}\n**Price:** ${productData.price}\n**Best for:** ${productData.occasions.join(", ")}\n**Available colors:** ${productData.colors.join(", ")}\n\nThis is a great ${productData.styleCategory.toLowerCase()} piece. ${this.getStyleTip(productData)}\n\nWould you like to try it on virtually, or should I suggest items from your wardrobe that would pair well with it?`,
        productData,
        suggestedActions: [
          {
            label: "Try On This",
            type: "try-on",
            payload: { url: productData.sourceUrl },
          },
          {
            label: "Find Similar in Wardrobe",
            type: "view-similar",
            payload: { category: productData.styleCategory },
          },
        ],
      };
    }

    // ── Wardrobe / Outfit Recommendation Flow
    if (
      lastMessage.includes("wear today") ||
      lastMessage.includes("outfit") ||
      lastMessage.includes("what should i wear") ||
      lastMessage.includes("suggest") ||
      lastMessage.includes("recommend")
    ) {
      return this.getWardrobeRecommendation(lastMessage, context);
    }

    // ── Fashion Advice Flow
    if (
      lastMessage.includes("trend") ||
      lastMessage.includes("style") ||
      lastMessage.includes("fashion") ||
      lastMessage.includes("color") ||
      lastMessage.includes("match") ||
      lastMessage.includes("pair") ||
      lastMessage.includes("goes with") ||
      lastMessage.includes("combine")
    ) {
      return this.getFashionAdvice(lastMessage);
    }

    // ── General Greeting / Fallback
    if (
      lastMessage.includes("hello") ||
      lastMessage.includes("hi") ||
      lastMessage.includes("hey")
    ) {
      return {
        reply: `Hey there! 👋 I'm your personal **Darpan Style Assistant**. Here's what I can help with:\n\n✨ **Analyze product links** — Paste any fashion product URL and I'll break down the details\n👗 **Outfit recommendations** — Tell me about your day and I'll suggest what to wear\n🎨 **Style advice** — Ask about trends, color matching, or building a capsule wardrobe\n👔 **Virtual try-on** — I can help you try on any garment virtually\n\nWhat would you like to explore?`,
        suggestedActions: [],
      };
    }

    // ── Generic fashion response
    return this.getGenericResponse(lastMessage);
  }

  async analyzeProductUrl(url: string): Promise<ProductAnalysis> {
    await this.simulateDelay();

    const brand = extractDomainHint(url);

    const mockProducts: ProductAnalysis[] = [
      {
        name: "Oversized Linen Blend Blazer",
        brand,
        price: "₹5,990",
        material: "55% Linen, 45% Cotton",
        styleCategory: "Smart Casual",
        sizingInfo: "Runs slightly oversized. Consider sizing down if you prefer a fitted look.",
        imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400",
        sourceUrl: url,
        description: "A relaxed oversized blazer in a breathable linen-cotton blend. Features notch lapels, a single-button closure, and patch pockets. The perfect transitional piece for layering.",
        colors: ["Sand", "Off-White", "Dusty Blue"],
        occasions: ["Brunch", "Office Casual", "Evening Out"],
      },
      {
        name: "Ribbed Knit Midi Dress",
        brand,
        price: "₹3,490",
        material: "78% Viscose, 22% Polyamide",
        styleCategory: "Elegant Casual",
        sizingInfo: "True to size with natural stretch. The ribbed knit conforms to your silhouette.",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=400",
        sourceUrl: url,
        description: "A figure-hugging ribbed knit midi dress with a subtle slit at the hem. The boat neckline and three-quarter sleeves create a sophisticated, timeless silhouette.",
        colors: ["Black", "Burgundy", "Forest Green"],
        occasions: ["Date Night", "Cocktail", "Gallery Opening"],
      },
      {
        name: "Wide-Leg Cotton Trousers",
        brand,
        price: "₹2,790",
        material: "100% Organic Cotton Twill",
        styleCategory: "Minimalist",
        sizingInfo: "High-rise fit. Inseam runs long — may need hemming for petite frames.",
        imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=400",
        sourceUrl: url,
        description: "Clean, architectural wide-leg trousers in organic cotton twill. Features a concealed zip fly, pressed front creases, and deep side pockets.",
        colors: ["Ecru", "Charcoal", "Navy"],
        occasions: ["Office", "Weekend", "Travel"],
      },
    ];

    return mockProducts[Math.floor(Math.random() * mockProducts.length)];
  }

  private getStyleTip(product: ProductAnalysis): string {
    const tips: Record<string, string> = {
      "Smart Casual": "Try pairing it with tailored trousers and minimal sneakers for a modern office look.",
      "Elegant Casual": "Layer with a structured coat and ankle boots for cooler evenings.",
      "Minimalist": "These work beautifully with a tucked silk blouse and pointed-toe flats.",
    };
    return tips[product.styleCategory] || "This is a versatile addition to any wardrobe.";
  }

  private getWardrobeRecommendation(
    message: string,
    context?: ChatContext
  ): AIResponse {
    const hasWardrobe = context?.wardrobeItems && context.wardrobeItems.length > 0;

    if (hasWardrobe) {
      const items = context!.wardrobeItems!;
      const top = items.find((i) => i.tag === "TOPS");
      const bottom = items.find((i) => i.tag === "BOTTOMS");
      const outer = items.find((i) => i.tag === "OUTERWEAR");

      let reply = `Based on your wardrobe, here's what I'd suggest for today:\n\n`;

      if (top && bottom) {
        reply += `**Top:** ${top.name} (${top.price})\n**Bottom:** ${bottom.name} (${bottom.price})\n`;
        if (outer) {
          reply += `**Layer:** ${outer.name} — perfect if it gets cooler later\n`;
        }
        reply += `\nThis combination creates a balanced silhouette with complementary textures. The ${top.name} adds structure while the ${bottom.name} keeps things relaxed.\n\n`;
        reply += `Want me to find accessories to complete this look, or would you prefer to try a different combination?`;
      } else {
        reply += `I can see you have **${items.length} piece${items.length > 1 ? "s" : ""}** in your wardrobe. `;
        reply += `To build a complete outfit, I'd recommend adding ${!top ? "some tops" : ""} ${!bottom ? "some bottoms" : ""} to your collection.\n\n`;
        reply += `Would you like me to suggest items that would complement what you already have?`;
      }

      return { reply, suggestedActions: [] };
    }

    return {
      reply: `I'd love to help you pick the perfect outfit! 🌟\n\nTo give you personalized recommendations from your wardrobe, I'll need access to your saved items. You can:\n\n1. **Enable wardrobe context** using the toggle below the chat input\n2. **Add items** to your wardrobe at the [Wardrobe](/wardrobe) page\n\nIn the meantime, tell me about your day — where are you headed? I can suggest general outfit ideas based on the occasion! 💫`,
      suggestedActions: [],
    };
  }

  private getFashionAdvice(message: string): AIResponse {
    const advice = [
      {
        reply: `Great question! Here are some **current trending styles** for this season:\n\n🔹 **Quiet Luxury** — Think understated elegance: cashmere knits, tailored trousers, neutral palettes\n🔹 **Dopamine Dressing** — Bold colors and unexpected combos are still going strong\n🔹 **Relaxed Tailoring** — Oversized blazers with wide-leg pants for effortless sophistication\n🔹 **Textured Layering** — Mix materials like linen, silk, and knit for visual depth\n\nWant me to help you incorporate any of these into your existing wardrobe? Or paste a product link and I'll tell you how trendy it is! 🔥`,
        suggestedActions: [] as SuggestedAction[],
      },
      {
        reply: `**Color matching** is one of my favorite topics! Here's a quick guide:\n\n🎨 **Monochromatic** — Different shades of one color create a sleek, elongating effect\n🎨 **Complementary** — Opposite on the color wheel (navy + burnt orange, emerald + blush)\n🎨 **Neutral + Pop** — All-neutral base with one statement color piece\n🎨 **Earth Tones** — Camel, olive, rust, and cream always work harmoniously\n\n**Pro tip:** Your skin's undertone determines whether you look best in warm (gold, olive, terracotta) or cool (silver, lavender, icy blue) shades.\n\nWant to know what colors work best with a specific piece? Paste a link! 🎯`,
        suggestedActions: [] as SuggestedAction[],
      },
      {
        reply: `Here's how to **build a versatile capsule wardrobe** with just 20-25 pieces:\n\n👕 **Tops (7-8):** 3 basic tees, 2 button-downs, 1 silk blouse, 1-2 knits\n👖 **Bottoms (5-6):** 2 jeans (dark + light), 1 tailored trouser, 1 skirt/short, 1 casual pant\n🧥 **Outerwear (3-4):** 1 blazer, 1 jacket, 1 coat, 1 light layer\n👟 **Shoes (4-5):** 1 sneaker, 1 loafer/flat, 1 boot, 1 dress shoe, 1 sandal\n\n**The 80/20 rule:** 80% of your wardrobe should be versatile neutrals, 20% should be statement pieces that express your personality.\n\nWould you like me to assess your current wardrobe against this framework? 📊`,
        suggestedActions: [] as SuggestedAction[],
      },
    ];

    return advice[Math.floor(Math.random() * advice.length)];
  }

  private getGenericResponse(message: string): AIResponse {
    const responses = [
      `That's an interesting question! In the fashion world, the key is always **balance and intention**. Every outfit should tell a story about who you are today.\n\nCould you tell me more about what you're looking for? I can help with:\n• Analyzing product links\n• Outfit suggestions from your wardrobe\n• Style advice and trend insights\n• Color and material pairing`,
      `I appreciate the thought! Fashion is deeply personal, and there's no single "right" answer. What matters is how the clothes make **you** feel.\n\nHere's what I can help with right now:\n• 🔗 Paste a product URL for detailed analysis\n• 👗 Ask "What should I wear today?" for wardrobe picks\n• 🎨 Ask about color combinations or current trends\n\nWhat interests you most?`,
    ];

    return {
      reply: responses[Math.floor(Math.random() * responses.length)],
      suggestedActions: [],
    };
  }
}

// ─── Real AI Service (Production) ───────────────────────────
// This implementation will be used when OPENAI_API_KEY is set.
// Fully implemented but dormant until API key is provided.

class RealAIService implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(
    messages: { role: "user" | "assistant"; content: string }[],
    context?: ChatContext
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(context);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} — ${errBody}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Check if the user's last message contains a URL
    const lastMsg = messages[messages.length - 1]?.content || "";
    const urls = extractUrls(lastMsg);
    let productData: ProductAnalysis | null = null;
    const suggestedActions: SuggestedAction[] = [];

    if (urls.length > 0) {
      try {
        productData = await this.analyzeProductUrl(urls[0]);
        suggestedActions.push(
          { label: "Try On This", type: "try-on", payload: { url: urls[0] } },
          { label: "Find Similar", type: "view-similar", payload: { category: productData.styleCategory } }
        );
      } catch {
        // URL analysis failed — still return the chat reply
      }
    }

    return { reply, productData, suggestedActions };
  }

  async analyzeProductUrl(url: string): Promise<ProductAnalysis> {
    const brand = extractDomainHint(url);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a fashion product analyzer. Given a product URL, return a JSON object with these fields: name, brand, price, material, styleCategory, sizingInfo, description, colors (array), occasions (array). The brand appears to be "${brand}". Respond ONLY with valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Analyze this fashion product URL and return structured data: ${url}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(content);
      return {
        name: parsed.name || "Unknown Product",
        brand: parsed.brand || brand,
        price: parsed.price || "Price not available",
        material: parsed.material || "Not specified",
        styleCategory: parsed.styleCategory || "General",
        sizingInfo: parsed.sizingInfo || "Standard sizing",
        imageUrl: "",
        sourceUrl: url,
        description: parsed.description || "",
        colors: parsed.colors || [],
        occasions: parsed.occasions || [],
      };
    } catch {
      return {
        name: "Product from " + brand,
        brand,
        price: "Price not available",
        material: "Not specified",
        styleCategory: "General",
        sizingInfo: "Standard sizing",
        imageUrl: "",
        sourceUrl: url,
        description: "Unable to parse product details. Please try again.",
        colors: [],
        occasions: [],
      };
    }
  }

  private buildSystemPrompt(context?: ChatContext): string {
    let prompt = `You are Darpan's AI Fashion Stylist — an expert in fashion, styling, and wardrobe management. You help users with:
1. Analyzing fashion product links (details, styling tips, sizing advice)
2. Outfit recommendations based on their wardrobe
3. Fashion trends, color theory, and style advice
4. Virtual try-on guidance

Be warm, knowledgeable, and concise. Use markdown formatting (bold, lists, emojis) for readability. Keep responses under 300 words.`;

    if (context?.wardrobeItems && context.wardrobeItems.length > 0) {
      prompt += `\n\nThe user's wardrobe contains these items:\n`;
      context.wardrobeItems.forEach((item) => {
        prompt += `- ${item.name} (${item.tag}, ${item.price})\n`;
      });
      prompt += `\nReference these items when making outfit suggestions.`;
    }

    return prompt;
  }
}

// ─── Factory ────────────────────────────────────────────────
// Auto-selects the right service based on environment.

export function getAIService(): AIService {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    console.log("[AI Service] Using RealAIService (OpenAI)");
    return new RealAIService(apiKey);
  }

  console.log("[AI Service] Using MockAIService (no API key found)");
  return new MockAIService();
}
