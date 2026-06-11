// Vercel serverless function (ESM, zero dependencies): redesign ONE budget tier
// from the user's uploaded room photo using OpenAI's image-edit endpoint.
// Returns the image as a base64 data URL (no external storage needed).
//
// POST /api/generate  body: { roomType, tier, imageBase64 }  -> { ok, tier, dataUrl }

import { generateTier, generateTierFromImage } from "../lib/openai-image.mjs";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const roomType =
      body.roomType ||
      (Array.isArray(body.roomTypes) ? body.roomTypes[0] : body.roomTypes) ||
      "room";
    const tier = body.tier || "base";

    let buffer;
    if (body.imageBase64) {
      const raw = String(body.imageBase64).replace(/^data:image\/\w+;base64,/, "");
      buffer = await generateTierFromImage(roomType, tier, Buffer.from(raw, "base64"), process.env.OPENAI_API_KEY);
    } else {
      buffer = await generateTier(roomType, tier, process.env.OPENAI_API_KEY);
    }

    const dataUrl = "data:image/png;base64," + buffer.toString("base64");
    return res.status(200).json({ ok: true, tier, dataUrl });
  } catch (err) {
    console.error("generate error:", err.message);
    const status = err.status === 429 ? 429 : 500;
    return res.status(status).json({
      ok: false,
      error: err.message,
      hint: err.status === 429 ? "OpenAI rate limit / quota — check your OpenAI billing." : undefined,
    });
  }
}
