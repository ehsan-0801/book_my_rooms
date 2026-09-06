import { remove, update } from "@/lib/api/factory";

export const PATCH = update("properties");
export const DELETE = remove("properties");
