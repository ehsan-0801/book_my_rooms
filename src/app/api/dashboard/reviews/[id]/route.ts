import { remove, update } from "@/lib/api/factory";

export const PATCH = update("reviews");
export const DELETE = remove("reviews");
