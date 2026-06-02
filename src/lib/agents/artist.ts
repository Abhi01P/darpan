// ─── Artist Agent ───────────────────────────────────────────
// TypeScript port to call DrapeNet's backend API.
// Virtual try-on via DrapeNet's /api/v1/try-on/process endpoint.
// Falls back to a side-by-side preview mock on error.

import type { AgentState } from "./types";

/**
 * Generates a mock try-on preview: an SVG showing the garment image
 * with a "Virtual Try-On Preview" overlay.
 */
function generateMockTryOn(garmentImageUrl: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="680" viewBox="0 0 512 680">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1018"/>
      <stop offset="100%" stop-color="#2a1f28"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c4a7d4" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#e8b4c8" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="512" height="680" fill="url(#bg)"/>
  <rect x="56" y="60" width="400" height="480" rx="12" fill="#0a0a0a" opacity="0.4"/>
  <image href="${garmentImageUrl}" x="66" y="70" width="380" height="460" preserveAspectRatio="xMidYMid meet" clip-path="inset(0 round 8px)"/>
  <rect x="56" y="60" width="400" height="480" rx="12" fill="url(#shine)"/>
  <rect x="56" y="460" width="400" height="80" rx="0" fill="rgba(0,0,0,0.6)"/>
  <text x="256" y="508" text-anchor="middle" fill="#e8dce0" font-family="sans-serif" font-size="16" font-weight="600" letter-spacing="2">✨ VIRTUAL TRY-ON PREVIEW</text>
  <rect x="0" y="580" width="512" height="100" fill="rgba(0,0,0,0.4)"/>
  <text x="256" y="620" text-anchor="middle" fill="#c4a7d4" font-family="sans-serif" font-size="12" letter-spacing="1" opacity="0.8">DEMO MODE — Fallback preview</text>
  <text x="256" y="648" text-anchor="middle" fill="#8a7a82" font-family="sans-serif" font-size="11" opacity="0.6">Check DrapeNet API connection</text>
</svg>`.trim();

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function base64ToBlob(base64DataUri: string): Blob {
  const matches = base64DataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 image data");
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  return new Blob([buffer], { type: mimeType });
}

export async function runArtist(state: AgentState): Promise<AgentState> {
  console.log("[Artist] Initiating Virtual Try-On via DrapeNet API");

  const userImage = state.userImageUrl;
  const garmentImage = state.garmentImageUrl;

  if (!userImage || (!garmentImage && !state.garmentPageUrl)) {
    console.log("[Artist] Missing images, skipping try-on generation");
    state.currentAgent = "artist";
    return state;
  }

  const backendUrl = process.env.DRAPENET_BACKEND_URL;

  try {
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
    };
    if (process.env.DRAPENET_EMAIL) headers["email"] = process.env.DRAPENET_EMAIL;
    if (process.env.DRAPENET_PASSWORD) headers["password"] = process.env.DRAPENET_PASSWORD;

    // STEP 1: Upload the user image to the backend to get a public URL
    console.log(`[Artist] Uploading user image to DrapeNet via process-images...`);
    const formData = new FormData();

    if (userImage.startsWith("data:")) {
      formData.append("user_image", base64ToBlob(userImage), "user_image.jpg");
    } else {
      throw new Error("User image must be a base64 upload.");
    }

    if (garmentImage) {
      if (garmentImage.startsWith("data:")) {
        formData.append("garment_image", base64ToBlob(garmentImage), "garment_image.jpg");
      } else {
        formData.append("garment_image_url", garmentImage);
      }
    }

    const uploadRes = await fetch(`${backendUrl}/api/v1/try-on/process-images`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.text();
      throw new Error(`DrapeNet upload error: ${uploadRes.status} - ${errData}`);
    }

    const uploadData = await uploadRes.json();
    const uploadedUserImageUrl = uploadData.result_image_url;

    if (!uploadedUserImageUrl) {
      throw new Error(`Failed to get hosted image URL. Response: ${JSON.stringify(uploadData)}`);
    }

    // STEP 2: Trigger the actual agent graph using the newly hosted URL
    console.log(`[Artist] Triggering main Try-On agent graph...`);
    const userQuery = state.chatHistory.length > 0
      ? state.chatHistory[state.chatHistory.length - 1].content
      : null;

    const jsonHeaders = {
      ...headers,
      "Content-Type": "application/json",
    };

    const processRes = await fetch(`${backendUrl}/api/v1/try-on/process`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        user_image_url: uploadedUserImageUrl,
        garment_image_url: garmentImage && !garmentImage.startsWith("data:") ? garmentImage : null,
        garment_page_url: state.garmentPageUrl || null,
        user_query: userQuery,
        user_gender: state.userGender || null,
        chat_history: state.chatHistory || [],
        disliked_items: state.dislikedItems || [],
      }),
    });

    if (!processRes.ok) {
      const errData = await processRes.text();
      throw new Error(`DrapeNet process API error: ${processRes.status} - ${errData}`);
    }

    const processData = await processRes.json();
    const taskId = processData.tryon_task_id;

    if (!taskId) {
      throw new Error(`No task ID returned from DrapeNet API. Response: ${JSON.stringify(processData)}`);
    }

    state.tryOnTaskId = taskId;
    if (processData.styling_advice) state.stylingAdvice = processData.styling_advice;
    if (processData.recommended_garment_id) state.recommendedGarmentId = processData.recommended_garment_id;
    if (processData.extracted_garment_title) state.garmentTitle = processData.extracted_garment_title;
    if (processData.recommended_items) state.recommendedItems = processData.recommended_items;

    console.log(`[Artist] Task initiated: ${taskId}. Polling for results...`);

    // STEP 3: Poll for results
    let maxRetries = 30; // 60 seconds max
    let isComplete = false;

    while (maxRetries > 0 && !isComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`${backendUrl}/api/v1/try-on/tasks/${taskId}`, {
        headers,
      });
      if (!statusRes.ok) {
        console.warn(`[Artist] Polling error: ${statusRes.status}`);
        maxRetries--;
        continue;
      }

      const statusData = await statusRes.json();

      if (statusData.status === "SUCCESS") {
        const finalUrl = statusData.result?.result_image_url;
        if (finalUrl) {
          try {
            console.log(`[Artist] Fetching final image to bypass ngrok browser warning...`);
            const imgRes = await fetch(finalUrl, {
              headers: { "ngrok-skip-browser-warning": "true" }
            });
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString("base64");
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              state.finalOutputUrl = `data:${contentType};base64,${base64}`;
              state.originalOutputUrl = finalUrl;
            } else {
              console.warn(`[Artist] Failed to fetch image, falling back to URL.`);
              state.finalOutputUrl = finalUrl;
              state.originalOutputUrl = finalUrl;
            }
          } catch (err) {
            console.warn(`[Artist] Error converting image to base64, falling back to URL:`, err);
            state.finalOutputUrl = finalUrl;
            state.originalOutputUrl = finalUrl;
          }
        } else {
          state.finalOutputUrl = null;
          state.originalOutputUrl = null;
        }

        console.log("[Artist] Virtual try-on generation successful!");
        isComplete = true;
      } else if (statusData.status === "FAILURE") {
        throw new Error("Try-on task failed on the backend.");
      }

      maxRetries--;
    }

    if (!isComplete) {
      throw new Error("Try-on task timed out.");
    }

  } catch (error) {
    console.error(`[Artist] Error during try-on: ${error}`);
    state.error = error instanceof Error ? error.message : "Unknown error";

    console.log("[Artist] Falling back to mock preview");
    state.finalOutputUrl = generateMockTryOn(garmentImage || "");
  }

  state.currentAgent = "artist";
  return state;
}

/**
 * Standalone try-on function for the dedicated /api/try-on endpoint.
 * Runs just the Artist without the full pipeline.
 */
export async function generateTryOn(
  userImageUrl: string,
  garmentImageUrl: string
): Promise<{ resultUrl: string | null; error: string | null }> {
  const state: AgentState = {
    userImageUrl,
    garmentImageUrl,
    garmentPageUrl: null,
    userGender: null,
    chatHistory: [],
    dislikedItems: [],
    imageType: "full_body",
    validationMessage: "",
    garmentTitle: null,
    intentType: null,
    recommendedGarmentId: null,
    recommendedItems: [],
    stylingAdvice: "",
    tryOnTaskId: null,
    finalOutputUrl: null,
    currentAgent: "",
    error: null,
  };

  const result = await runArtist(state);
  return {
    resultUrl: result.finalOutputUrl,
    error: result.error,
  };
}
