import { remove, update } from "@/lib/api/factory";

export const PATCH = update("rooms");
export const DELETE = remove("rooms");
