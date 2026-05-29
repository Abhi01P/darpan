# DrapeNet — Presentation Report
### Source document for AI-generated slide deck
**Project:** DrapeNet — An Agentic AI Virtual Try-On & Conversational Styling Platform
**Format:** Slide-by-slide content + speaker notes. Each `## SLIDE N` block = one slide.

> **Note for the deck builder:** Sections marked **[SHIPPED]** describe functionality that exists in the codebase today. Sections marked **[ROADMAP]** describe the planned future vision and should be presented as such (forward-looking, not current). Keep that distinction intact — it reads as ambition, not overclaiming.

---

## SLIDE 1 — Title

**Title:** DrapeNet
**Subtitle:** Agentic AI for Virtual Try-On & Conversational Fashion Styling
**Tagline:** *"Your AI stylist, your digital mirror — see it before you wear it."*

**Footer:** [Your Name(s)] · [Course / Professor] · [Date]

**Speaker notes:** Open with the hook: online clothes shopping has a ~30–40% return rate, largely because people can't tell how something will look on *them*. DrapeNet attacks that problem with generative AI. One line: "We built a system where you upload a photo, talk to an AI stylist in plain English, and watch garments get rendered onto your own body in seconds."

---

## SLIDE 2 — The Problem

**Title:** Why Online Fashion Is Broken

**Body (bullets):**
- Shoppers can't visualize how a garment looks on *their own body* → low confidence, abandoned carts.
- High return rates drive cost and waste (logistics, repackaging, environmental impact).
- Traditional product pages are static — no personalization, no guidance, no "stylist."
- Existing virtual try-on tools are rigid: fixed poses, single garment, no conversation.

**Speaker notes:** Frame the pain points around the end user *and* the retailer. Emphasize that the gap isn't just visualization — it's the lack of an intelligent, conversational layer that understands intent.

---

## SLIDE 3 — Our Solution

**Title:** DrapeNet — A Conversational, Agentic Try-On Engine

**Body:**
- **Talk, don't click.** Describe what you want ("show me a casual summer shirt") — the AI interprets intent.
- **See it on you.** Generative AI renders the garment onto your uploaded photo while preserving your face and pose.
- **Discover live.** The system pulls real products from live retailers and lets you swipe to refine taste.
- **Build a wardrobe.** Save favorites, compare prices across the web, and revisit your virtual closet.

**Speaker notes:** This is the "what it does" slide. Keep it benefit-first; the architecture comes next.

---

## SLIDE 4 — Live Demo Snapshot

**Title:** The Experience, End to End

**Body (numbered flow):**
1. **Sign in** → secure JWT-authenticated session.
2. **Upload your photo** → becomes your persistent "Digital Twin."
3. **Chat** → "Find me something for a beach party." The AI Stylist responds with advice + a deck of real products.
4. **Swipe** → like/dislike to teach the system your taste.
5. **Try on** → pick an item; the AI Artist synthesizes you wearing it.
6. **Save & compare** → add to wardrobe; see price comparisons from across the web.

**Speaker notes:** Walk through with a screenshot per step if available (the repo has sample output images). This is the slide that earns engagement — keep it concrete.

---

## SLIDE 5 — System Architecture (Big Picture) [SHIPPED]

**Title:** Architecture at a Glance

**Body / diagram description:**
- **Frontend:** React 19 + Vite single-page app (Tailwind CSS, Zustand state management).
- **Backend:** FastAPI (async, Python) — REST API under `/api/v1`.
- **AI Orchestration:** LangGraph state machine coordinating three specialized agents.
- **Generative AI:** Google Gemini (multimodal image generation + reasoning) via Vertex AI.
- **Data:** MongoDB (users, wardrobes, catalog) + MongoDB Atlas Vector Search (semantic fashion retrieval).
- **Live Web Layer:** Retailer search + reverse-image price comparison.

**Diagram suggestion:** Left-to-right flow: `User → React SPA → FastAPI → LangGraph (Gatekeeper → Stylist → Artist) → Gemini / MongoDB / Web`.

**Speaker notes:** Stress that this is a *modular, agentic* design — each agent has one job, which makes the system explainable and extensible.

---

## SLIDE 6 — The Agentic Core [SHIPPED]

**Title:** Three Specialized AI Agents, One Pipeline

**Body:**
- **🛡️ Gatekeeper** — validates input, extracts product URLs, scrapes garment metadata, and routes the request. The system's "front door."
- **🎨 Stylist** — the brain. Uses Gemini to classify user intent (greeting, clarify, search, or direct try-on), performs retrieval-augmented generation, runs live product search, and crafts styling advice.
- **🖌️ Artist** — the hands. Calls Gemini's multimodal image model to synthesize the final try-on image.

**Orchestration:** Built on **LangGraph**, a directed state-machine framework — agents pass a shared state object, enabling clean hand-offs and conditional routing.

**Speaker notes:** This is the technical centerpiece. Emphasize "separation of concerns" — a professor loves clean architecture. Each agent is independently testable and swappable.

---

## SLIDE 7 — Intent Understanding (The Stylist) [SHIPPED]

**Title:** Understanding What the User Actually Wants

**Body:**
- Natural-language intent classification via Gemini into discrete modes:
  - **GREETING** → warm onboarding response.
  - **CLARIFY** → asks follow-ups about color / fit / occasion.
  - **SEARCH** → generates an e-commerce query and fetches live products.
  - **TRYON_SPECIFIC** → goes straight to image synthesis for a chosen item.
- **Gender-aware** query construction for more relevant results.
- **Personalization:** factors in the user's previously disliked items to avoid repeats.

**Speaker notes:** Point out that this turns a chat box into a routing layer — the same input field handles conversation, search, and try-on.

---

## SLIDE 8 — Generative Virtual Try-On (The Artist) [SHIPPED]

**Title:** Putting Clothes on You — With Identity Preserved

**Body:**
- Powered by **Google Gemini 2.5 Flash Image**, a native multimodal image-generation model.
- Takes two inputs: **your photo** + **the garment image**.
- Carefully engineered prompt enforces a hard constraint: **preserve the user's face, hair, and identity** — change only the clothing, keeping lighting and pose consistent.
- Output is saved and served back to the frontend as the "Virtual Mirror" result.

**Speaker notes:** Highlight the prompt-engineering discipline — the identity-preservation constraint is what separates a usable try-on from an uncanny one. This is a real, defensible engineering decision.

---

## SLIDE 9 — Retrieval-Augmented Recommendations [SHIPPED]

**Title:** Smarter Suggestions with RAG + Vector Search

**Body:**
- Fashion items are embedded into vectors using Gemini embeddings.
- Stored in **MongoDB Atlas Vector Search** for semantic similarity retrieval.
- The Stylist agent grounds its recommendations in this catalog — combining LLM reasoning with real, retrievable data (Retrieval-Augmented Generation).
- Result: suggestions that are relevant *and* explainable, not hallucinated.

**Speaker notes:** Use the buzzwords correctly — RAG and vector search are exactly what professors want to see applied, not just named.

---

## SLIDE 10 — Live Web Intelligence [SHIPPED]

**Title:** Real Products, Real Prices — From the Live Web

**Body:**
- **Live retailer search** across fashion e-commerce sources returns up-to-date products with images and links.
- **Reverse-image price comparison:** given a garment image, the system performs a visual search to find the same item across multiple retailers and surface price options.
- Users can **add an item by URL** — the system scrapes the product page (title, image) automatically.

**Speaker notes:** This is a strong differentiator — the system isn't a closed demo dataset; it reaches into the live web. Mention graceful handling and relevance filtering.

---

## SLIDE 11 — The Frontend Experience [SHIPPED]

**Title:** A Polished, Modern Interface

**Body:**
- **React 19 + Vite** SPA — fast, modern, mobile-responsive.
- **Tailwind CSS** with a dark, design-token-driven theme.
- **Zustand** stores for clean, predictable state (auth, try-on workflow, wardrobe, UI).
- Key views: **Fitting Room** (chat + virtual mirror), **Catalog**, **Wardrobe**, **Auth**.
- **Swipe-based recommendation deck** — a familiar, engaging interaction pattern for refining taste.

**Speaker notes:** Show the dark, premium UI. Mention the swipe UX as a deliberate UX choice that makes preference-collection feel effortless.

---

## SLIDE 12 — Security & Engineering Quality [SHIPPED]

**Title:** Built Like a Real Product

**Body:**
- **JWT authentication** with bcrypt-hashed passwords (industry-standard).
- **Input validation** with Pydantic schemas across all API boundaries.
- **File-upload safeguards:** MIME-type enforcement and configurable size limits.
- **Async FastAPI** backend for concurrent request handling.
- **Robust error handling** — including graceful parsing of validation errors for the UI.

**Speaker notes:** This slide signals engineering maturity. Professors reward security awareness and validation — call out the bcrypt + JWT + Pydantic trio explicitly.

---

## SLIDE 13 — Tech Stack [SHIPPED]

**Title:** Technology Stack

**Body (grouped):**
- **AI/ML:** Google Gemini (multimodal generation + reasoning + embeddings), LangGraph, LangChain.
- **Backend:** FastAPI, Uvicorn, Pydantic, Motor (async MongoDB).
- **Data:** MongoDB + Atlas Vector Search, Redis (task/caching infrastructure).
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Zustand, Axios.
- **Infra/Tooling:** Docker Compose (MongoDB), `uv` (Python packaging), Vercel-ready deployment config.

**Speaker notes:** A clean stack slide. Keep logos if the deck tool supports them.

---

## SLIDE 14 — Engineering Challenges We Solved [SHIPPED]

**Title:** Real Problems, Real Fixes

**Body:**
- **Cross-origin media delivery:** uploaded images must resolve to a publicly reachable URL (not `localhost`) when served through a secure tunnel — solved by environment-driven base-URL configuration.
- **API routing correctness:** eliminated a `307` redirect on uploads that silently dropped multipart payloads behind an HTTPS proxy.
- **Performance:** scoped the dev hot-reload watcher to the application package, cutting idle CPU from ~80% to ~14% and removing response stalls.
- **Resilience:** added request timeouts so the UI fails gracefully instead of hanging.

**Speaker notes:** This is gold for marks — it shows you *debugged real systems*, not just wired libraries together. Tell these as short war stories.

---

## SLIDE 15 — Future Roadmap & Vision [ROADMAP]

**Title:** Where DrapeNet Goes Next

> Present this section as forward-looking vision — these are planned, not yet shipped.

**Body:**
- **Real-time 3D digital twin** — a Three.js-based 3D avatar with garment draping (foundations exist in an experimental frontend).
- **Live AR mirror** with pose tracking (MediaPipe) for try-on via webcam in motion.
- **Body-measurement-aware fit prediction** — size recommendations from user measurements.
- **Asynchronous generation at scale** — Celery + Redis worker queue for high-throughput batch try-ons (infrastructure already scaffolded).
- **Outfit composition** — combine multiple garments into full looks.
- **Sustainability scoring** — surface eco-impact and resale options per item.

**Speaker notes:** Be explicit: "This is our roadmap." It demonstrates vision and that you understand the next engineering steps — without claiming they're done.

---

## SLIDE 16 — Impact & Why It Matters

**Title:** The Impact

**Body:**
- **For shoppers:** confidence before purchase → fewer disappointing buys.
- **For retailers:** lower return rates, higher conversion, richer engagement.
- **For sustainability:** fewer returns means less logistics waste.
- **For the field:** a working blueprint for *agentic* generative-AI applications — multiple specialized agents, RAG grounding, and multimodal generation in one coherent product.

**Speaker notes:** Bring it back to the big picture. The agentic architecture is the transferable lesson.

---

## SLIDE 17 — Summary

**Title:** What We Built

**Body:**
- An end-to-end, conversational, agentic virtual try-on platform.
- Three specialized AI agents orchestrated with LangGraph.
- Multimodal generative try-on with identity preservation.
- RAG + vector search for grounded recommendations.
- Live web product discovery and price comparison.
- A polished, secure, production-minded full-stack implementation.

**Speaker notes:** This is the recap. Keep it tight — six bullets, six breaths.

---

## SLIDE 18 — Thank You / Q&A

**Title:** Thank You
**Subtitle:** Questions?

**Body:**
- [Team names]
- [Repository / demo link]
- [Contact]

**Speaker notes:** Invite questions. Be ready to demo live or via recorded clip. Anticipate questions on: how identity preservation works, how vector search is set up, and how the agents hand off state.

---

### Appendix — Honest Scope Note (for your reference, not a slide)
Everything marked **[SHIPPED]** corresponds to code in the repository. Everything marked **[ROADMAP]** is aspirational and is framed as future work. If you demo live, stick to the shipped features; present the roadmap as vision. This keeps the presentation impressive *and* defensible under questioning.

---

# DESIGN SPECIFICATION
### Visual system for the deck builder — apply consistently across all slides.

This deck should feel like the DrapeNet product itself: **dark, premium, modern, tech-forward.** Think "AI startup launch keynote," not "school report."

## 1. Color Palette

**Theme: Dark mode, high-contrast, indigo/violet accent.**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background (primary) | Near-black slate | `#0B0F19` | Main slide background |
| Surface / card | Dark slate | `#151B2B` | Content cards, panels, code blocks |
| Surface (elevated) | Lighter slate | `#1E263B` | Hover/highlight cards, callouts |
| Primary accent | Indigo | `#6366F1` | Headings highlights, key icons, agent labels |
| Secondary accent | Violet | `#A855F7` | Gradients, emphasis, "AI" moments |
| Accent gradient | Indigo → Violet | `#6366F1 → #A855F7` | Title slide, section dividers, hero elements |
| Success / "shipped" | Emerald | `#10B981` | [SHIPPED] tags, checkmarks, success states |
| Roadmap / future | Amber | `#F59E0B` | [ROADMAP] tags, "future" callouts |
| Text (primary) | Off-white | `#E5E7EB` | Body text |
| Text (muted) | Slate gray | `#94A3B8` | Sub-labels, captions, speaker-note style |
| Border / divider | Subtle white | `rgba(255,255,255,0.08)` | Card borders, separators |

**Rule:** Use the indigo→violet gradient sparingly for impact — title, section breaks, and the single most important element per slide. Don't gradient everything.

## 2. Typography

| Element | Font | Weight | Size (16:9) | Color |
|---------|------|--------|-------------|-------|
| Slide title | **Inter** or **Poppins** | Bold (700) | 40–48 pt | Off-white, key word in indigo |
| Subtitle / tagline | Inter | Medium (500) | 22–26 pt | Muted slate |
| Body bullets | Inter | Regular (400) | 18–22 pt | Off-white |
| Labels / tags | Inter | Semibold (600), UPPERCASE, letter-spaced | 12–14 pt | Accent color |
| Code / technical | **JetBrains Mono** or **Fira Code** | Regular | 14–16 pt | Off-white on `#151B2B` |

**Fallback fonts:** if Inter/Poppins unavailable, use Montserrat (headings) + system sans (body). Avoid default Calibri/Arial — it kills the premium feel.

## 3. Iconography & Imagery

- Use a **single consistent icon set** — Lucide or Heroicons (the app uses Lucide). Line-style icons, indigo or off-white.
- Agents get signature icons/emoji: 🛡️ Gatekeeper, 🎨 Stylist, 🖌️ Artist — keep these consistent everywhere they appear.
- Prefer **real screenshots** of the app (Fitting Room, Virtual Mirror result, swipe deck) over stock photos. The repo contains sample try-on output images — use them.
- For the architecture diagram: nodes as rounded rectangles (`#151B2B` fill, indigo border), arrows in muted slate, the three agents highlighted in the indigo→violet gradient.

## 4. Layout Grid & Spacing

- **Aspect ratio:** 16:9.
- **Generous margins:** ~8% padding on all edges. Never let text touch the frame.
- **One idea per slide.** Max ~6 bullets; max ~8 words per bullet. Push detail into speaker notes.
- **Consistent title zone:** title top-left, with a thin indigo accent bar or small kicker label above it.
- **Left-align** body content (more modern than centered for content slides). Center only on title/section/closing slides.

## 5. Tag System (visual treatment of [SHIPPED] / [ROADMAP])

- **[SHIPPED]** → small emerald pill, top-right of slide: `● SHIPPED` (emerald dot + uppercase).
- **[ROADMAP]** → small amber pill: `◆ ROADMAP / VISION`.
- This gives the professor an at-a-glance, honest signal of what's built vs. planned — and reads as deliberate, mature scoping.

## 6. Per-Slide Layout Hints

| Slide | Layout treatment |
|-------|------------------|
| 1 — Title | Full-bleed dark bg, large gradient "DrapeNet" wordmark centered, tagline below, subtle abstract mesh/gradient orb in a corner. |
| 2 — Problem | Left: punchy headline. Right: 3–4 pain-point cards with icons. Cool tone (less accent) to signal "the problem." |
| 3 — Solution | Pivot to warm/accent-heavy. 4 benefit cards in a 2×2 grid, each with an icon. |
| 4 — Demo flow | Horizontal numbered stepper (1→6) across the slide, each step a small card. |
| 5 — Architecture | Full-width left-to-right flow diagram. This is a hero slide — give it room. |
| 6 — Agentic core | Three vertical agent columns (Gatekeeper / Stylist / Artist), each with icon, title, one-line role. Gradient accent on the three. |
| 7 — Intent | Branching diagram: one input → 4 intent modes (GREETING/CLARIFY/SEARCH/TRYON). |
| 8 — Try-on | Split: left = "your photo + garment" inputs; right = generated result. Show the identity-preservation constraint as a callout. |
| 9 — RAG | Pipeline strip: items → embeddings → vector DB → grounded results. |
| 10 — Live web | Two cards: "Live retailer search" + "Reverse-image price comparison." |
| 11 — Frontend | Device mockup (laptop/phone) showing the dark UI screenshot. |
| 12 — Security | 5 icon-bullets in a clean row/grid; lock/shield motif. |
| 13 — Tech stack | Logo grid grouped by layer (AI / Backend / Data / Frontend / Infra). |
| 14 — Challenges | 4 "war story" cards: problem → fix, each with a before/after metric where possible (e.g., 80% → 14% CPU). |
| 15 — Roadmap | Timeline or horizontal roadmap; every item carries the amber ROADMAP pill. |
| 16 — Impact | 3 columns: Shoppers / Retailers / Sustainability, each with a bold stat or icon. |
| 17 — Summary | 6 checkmarked bullets (emerald checks) on dark bg. |
| 18 — Thank You | Mirror the title slide: gradient wordmark, "Questions?", contact/links. |

## 7. Motion (if the tool supports it)

- Subtle fade/slide-up on bullet reveal — one bullet at a time on dense slides.
- Architecture and agent slides: animate the flow left-to-right so the pipeline "builds."
- Keep it tasteful — no spins, bounces, or flashy transitions. Premium = restrained.

## 8. One-Line Brief for the AI Deck Builder
> Build a 16:9, dark-mode keynote deck with an indigo→violet accent and Inter/JetBrains Mono typography. One idea per slide, generous spacing, Lucide icons, real app screenshots. Tag each slide [SHIPPED] (emerald) or [ROADMAP] (amber) per the content. Aim for "AI startup launch," not "student report."
