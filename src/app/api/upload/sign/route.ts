import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { folderFor, signUpload, type UploadKind } from "@/lib/cloudinary";

const ALLOWED: UploadKind[] = ["properties", "rooms", "avatars", "banners"];

/**
 * Issues a signature for a direct browser → Cloudinary upload.
 *
 * Only signed-in users can get one, and the folder is chosen here rather than
 * accepted from the client, so nobody can write outside `book_my_rooms/`.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { kind?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const kind = (body.kind ?? "properties") as UploadKind;
  if (!ALLOWED.includes(kind)) {
    return NextResponse.json({ error: "Unsupported upload kind" }, { status: 400 });
  }

  // Avatars are the only kind a plain customer may upload.
  if (kind !== "avatars" && session.user.role === "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (kind === "banners" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = folderFor(kind);

  // Every field signed here must be sent verbatim with the upload, or
  // Cloudinary rejects the signature.
  const paramsToSign = { folder, timestamp };
  const signature = signUpload(paramsToSign);

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}
