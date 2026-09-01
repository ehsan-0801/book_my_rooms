import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UPLOAD_FOLDER, deleteAsset } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { publicId } = (await request.json().catch(() => ({}))) as {
    publicId?: string;
  };
  if (!publicId) {
    return NextResponse.json({ error: "publicId is required" }, { status: 400 });
  }

  // Never let a caller delete outside this project's folder.
  if (!publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await deleteAsset(publicId);
  return NextResponse.json({ result: result.result });
}
