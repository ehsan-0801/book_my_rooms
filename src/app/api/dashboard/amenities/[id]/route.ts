import { remove, update } from "@/lib/api/factory";

export const PATCH = update("amenities");
export const DELETE = remove("amenities");
