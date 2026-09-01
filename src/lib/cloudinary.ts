import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is configured server-side only — the API secret must never reach
 * the browser. Uploads go through a short-lived signature (see
 * `src/app/api/upload/sign/route.ts`) so the secret stays on the server while
 * the file itself goes straight from the browser to Cloudinary.
 */
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "book_my_rooms";

/** Subfolders keep property, room and avatar assets separable in the console. */
export type UploadKind = "properties" | "rooms" | "avatars" | "banners";

export function folderFor(kind: UploadKind) {
  return `${UPLOAD_FOLDER}/${kind}`;
}

export { cloudinary };

/** Signs a direct-from-browser upload. Valid for Cloudinary's default window. */
export function signUpload(params: Record<string, string | number>) {
  return cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!,
  );
}

export async function deleteAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

/** Builds a transformed delivery URL for an already-uploaded asset. */
export function cloudinaryUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string } = {},
) {
  return cloudinary.url(publicId, {
    width: opts.width,
    height: opts.height,
    crop: opts.crop ?? "fill",
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });
}
