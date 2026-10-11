import { getSupabase } from "./client";

const BUCKET = "token-meta";
const MAX_BYTES = 5 * 1024 * 1024;

export interface SocialLinks { telegram?: string; twitter?: string; website?: string }

/** Uploads the token image and a metadata JSON to Supabase Storage. Returns the public metadata URI. */
export async function uploadTokenMetadata(a: { name: string; symbol: string; description: string; image: File; links?: SocialLinks }) {
  const sb = getSupabase();
  if (!sb) throw new Error("Image upload needs Supabase. Add your Supabase keys, or paste a metadata link under Advanced.");
  if (!a.image.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (a.image.size > MAX_BYTES) throw new Error("Image is too big. Please use one under 5 MB.");
  const id = crypto.randomUUID();
  const ext = (a.image.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const imgPath = `${id}/image.${ext}`;
  const up = await sb.storage.from(BUCKET).upload(imgPath, a.image, { contentType: a.image.type });
  if (up.error) throw new Error(`Image upload failed: ${up.error.message}`);
  const imageUrl = sb.storage.from(BUCKET).getPublicUrl(imgPath).data.publicUrl;
  const links = Object.fromEntries(Object.entries(a.links ?? {}).filter(([, v]) => v && v.trim()));
  const json = { name: a.name, symbol: a.symbol, description: a.description, image: imageUrl, ...(a.links?.website ? { external_url: a.links.website } : {}), ...(Object.keys(links).length ? { extensions: links } : {}) };
  const body = new Blob([JSON.stringify(json)], { type: "application/json" });
  const metaPath = `${id}/metadata.json`;
  const m = await sb.storage.from(BUCKET).upload(metaPath, body, { contentType: "application/json" });
  if (m.error) throw new Error(`Metadata upload failed: ${m.error.message}`);
  return { uri: sb.storage.from(BUCKET).getPublicUrl(metaPath).data.publicUrl, imageUrl };
}
