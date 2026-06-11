// OpenAI image generation ("ChatGPT image generator"), one tier at a time.
// Keeping generation to a single image per call keeps each Vercel serverless
// invocation well under the function time limit.

const OPENAI_URL = "https://api.openai.com/v1/images/generations";
const OPENAI_EDIT_URL = "https://api.openai.com/v1/images/edits";
const MODEL = "gpt-image-1";
const SIZE = "1024x1536"; // portrait, matches the on-site comparison layout
const EDIT_SIZE = "1024x1024"; // square keeps the base64 edit response under Vercel's body limit
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";

// Prompts used when REDESIGNING the user's uploaded room photo (image edit).
// Emphasis on keeping the room's structure while restyling per tier.
const EDIT_PROMPTS = {
  base: "Redesign this {room} as a budget-friendly interior. Keep the room's existing layout, walls, windows and proportions; restyle with clean lines, neutral colors, basic affordable finishes and functional furniture. Photorealistic.",
  essential: "Redesign this {room} as a modern mid-range interior. Keep the room's existing layout, walls, windows and proportions; restyle with a sophisticated palette, an accent color, quality furniture and warm accent lighting. Photorealistic.",
  premium: "Redesign this {room} as a luxury designer interior. Keep the room's existing layout, walls, windows and proportions; restyle with high-end materials, a rich curated color scheme, premium finishes, designer furniture and statement lighting. Photorealistic, magazine-worthy.",
};

const TIER_PROMPTS = {
  base: "Interior photograph of a simple, budget-friendly {room}. Clean lines, neutral colors, basic laminate finishes, functional minimal layout, bright natural daylight, practical. No text, no labels, no watermark. Photorealistic real-estate photography.",
  essential: "Interior photograph of a modern, stylish mid-range {room}. Sophisticated palette with an accent color, quality materials, warm accent lighting, contemporary design, inviting. No text, no labels, no watermark. Photorealistic real-estate photography.",
  premium: "Interior photograph of a luxury designer {room}. High-end materials, rich curated color scheme, premium finishes, designer lighting, statement pieces, magazine-worthy. No text, no labels, no watermark. Photorealistic high-end real-estate photography.",
};

/**
 * Generate a single budget-tier image. Returns PNG/JPEG bytes (Buffer).
 */
export async function generateTier(roomType, tier, apiKey) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const tpl = TIER_PROMPTS[tier];
  if (!tpl) throw new Error(`Unknown tier "${tier}"`);
  const prompt = tpl.replace("{room}", roomType || "room");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, n: 1, size: SIZE, quality: QUALITY }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`OpenAI ${res.status}: ${detail.slice(0, 220)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return Buffer.from(b64, "base64");
}

/**
 * Redesign a single budget tier FROM the user's uploaded room photo (image edit).
 * @param {string} roomType   e.g. "Kitchen"
 * @param {string} tier       base | essential | premium
 * @param {Buffer} imageBuffer the user's photo bytes
 * @param {string} apiKey
 * @returns {Promise<Buffer>} redesigned image bytes
 */
export async function generateTierFromImage(roomType, tier, imageBuffer, apiKey) {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const tpl = EDIT_PROMPTS[tier];
  if (!tpl) throw new Error(`Unknown tier "${tier}"`);
  const prompt = tpl.replace("{room}", roomType || "room");

  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", EDIT_SIZE);
  form.append("quality", QUALITY);
  form.append("image", new Blob([imageBuffer], { type: "image/jpeg" }), "room.jpg");

  const res = await fetch(OPENAI_EDIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` }, // do NOT set Content-Type; fetch sets the multipart boundary
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`OpenAI edit ${res.status}: ${detail.slice(0, 220)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no edited image");
  return Buffer.from(b64, "base64");
}
