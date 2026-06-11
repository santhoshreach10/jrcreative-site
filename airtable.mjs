// Vercel serverless function (ESM, zero dependencies): save a lead and (optionally) send WhatsApp.
// POST /api/lead  body: { phone, email?, constructionStage?, bedrooms?, roomTypes?,
//   baseDesignUrl?, essentialDesignUrl?, premiumDesignUrl? }  -> { ok, recordId, whatsapp }

import { createLead } from "../lib/airtable.mjs";
import { sendDesignPackage } from "../lib/whatsapp.mjs";

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const phone = String(body.phone || "").replace(/\s/g, "");
    if (!phone || !/^\+?\d{10,15}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: "A valid phone number is required." });
    }

    const result = await createLead(body, {
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID,
      tableId: process.env.AIRTABLE_TABLE_ID,
    });

    let whatsapp = { attempted: false };
    const images = { base: body.baseDesignUrl, essential: body.essentialDesignUrl, premium: body.premiumDesignUrl };
    const waCfg = { token: process.env.WHATSAPP_API_TOKEN, phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID };
    if (waCfg.token && waCfg.phoneNumberId && (images.base || images.essential || images.premium)) {
      whatsapp = { attempted: true };
      try { const wa = await sendDesignPackage(phone, images, waCfg); whatsapp.sent = wa.sent; }
      catch (waErr) { console.error("whatsapp error:", waErr.message); whatsapp.error = waErr.message; }
    }

    return res.status(200).json({ ok: true, recordId: result.id, whatsapp });
  } catch (err) {
    console.error("lead error:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
