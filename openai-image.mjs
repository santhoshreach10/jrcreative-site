// Airtable lead storage
// Writes a lead record to the JRCreative base using the Airtable REST API.
// Field IDs are used (more stable than names) and were confirmed from the live schema.

const AIRTABLE_API = "https://api.airtable.com/v0";

// Field IDs for JRCreative > "Table 1" (confirmed from live schema 2026-06-10).
// If you restructure the table, update these IDs.
export const FIELDS = {
  name: "fld7tybPntUxKdPEm", // Name (primary)
  phone: "fldcfWCb2ELjPz2eF", // Phone
  email: "fldFcRxkh5DDP0YC4", // Email
  constructionStage: "fldBq7QHQ6uA5t37f", // Construction Stage
  bedrooms: "fldEBS8Rhd4NKZfEx", // Bedrooms (number)
  roomTypes: "fld1Mmt81ANsIcXwi", // Room Types
  baseDesignUrl: "fldATEnoEq1Fw7JAk", // Base Design URL
  essentialDesignUrl: "fldenrfBZJjFKUXLL", // Essential Design URL
  premiumDesignUrl: "fldZORa93YVbXecqf", // Premium Design URL
  roomPhotoUrl: "fldaPPFbZ2KzHBMZ8", // Room Photo URL
  floorPlanUrl: "fldFfWsthU4jLeeOP", // Floor Plan URL
  // "Created" is a createdTime field — auto-populated, do not write.
};

/**
 * Create a lead record in Airtable.
 * @param {object} lead - normalized lead data
 * @param {object} cfg  - { apiKey, baseId, tableId }
 * @returns {Promise<{id:string}>}
 */
export async function createLead(lead, cfg) {
  const { apiKey, baseId, tableId } = cfg;
  if (!apiKey) throw new Error("AIRTABLE_API_KEY is not configured");
  if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");
  if (!tableId) throw new Error("AIRTABLE_TABLE_ID is not configured");

  // Build the fields object, only including values that are present.
  const fields = {};
  const displayName = lead.name || `Lead ${lead.phone || ""}`.trim();
  fields[FIELDS.name] = displayName;
  if (lead.phone) fields[FIELDS.phone] = lead.phone;
  if (lead.email) fields[FIELDS.email] = lead.email;
  if (lead.constructionStage) fields[FIELDS.constructionStage] = lead.constructionStage;
  if (lead.bedrooms != null && lead.bedrooms !== "") {
    const n = Number(lead.bedrooms);
    if (!Number.isNaN(n)) fields[FIELDS.bedrooms] = n;
  }
  if (Array.isArray(lead.roomTypes)) {
    fields[FIELDS.roomTypes] = lead.roomTypes.join(", ");
  } else if (lead.roomTypes) {
    fields[FIELDS.roomTypes] = String(lead.roomTypes);
  }
  if (lead.baseDesignUrl) fields[FIELDS.baseDesignUrl] = lead.baseDesignUrl;
  if (lead.essentialDesignUrl) fields[FIELDS.essentialDesignUrl] = lead.essentialDesignUrl;
  if (lead.premiumDesignUrl) fields[FIELDS.premiumDesignUrl] = lead.premiumDesignUrl;
  if (lead.roomPhotoUrl) fields[FIELDS.roomPhotoUrl] = lead.roomPhotoUrl;
  if (lead.floorPlanUrl) fields[FIELDS.floorPlanUrl] = lead.floorPlanUrl;

  const res = await fetch(`${AIRTABLE_API}/${baseId}/${tableId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Airtable returned ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  return { id: data.records?.[0]?.id };
}
