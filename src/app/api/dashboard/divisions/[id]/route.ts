import { remove, update } from "@/lib/api/factory";

export const PATCH = update("divisions");
export const DELETE = remove("divisions");
