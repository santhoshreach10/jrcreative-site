// Quick diagnostic endpoint. Visit /api/health on your deployed site.
// Reports which integrations are configured (booleans only — never the secrets).

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    airtableConfigured: Boolean(
      process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE_ID
    ),
    whatsappConfigured: Boolean(
      process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
    ),
  });
}
