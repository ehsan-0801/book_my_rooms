import { remove, update } from "@/lib/api/factory";

export const PATCH = update("banners");
export const DELETE = remove("banners");
