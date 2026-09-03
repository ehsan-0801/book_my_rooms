/**
 * Every server action expects `FormData` — that's what an HTML form and
 * `ActionForm` both produce natively. The REST surface accepts plain JSON,
 * since that's what any external caller (curl, a future mobile client, an
 * integration) will actually send, so this bridges the two without either
 * side knowing the other exists.
 *
 * - an array becomes repeated `append()` calls, matching `formData.getAll()`
 *   the way `amenityIds` checkboxes already work
 * - an object is JSON-stringified, matching the `images` field the uploader
 *   forms already write and the actions already `JSON.parse()`
 * - everything else is stringified as-is
 */
export function jsonToFormData(body: unknown): FormData {
  const fd = new FormData();
  if (!body || typeof body !== "object") return fd;

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) fd.append(key, String(item));
    } else if (typeof value === "object") {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Request body must be valid JSON");
  }
}
