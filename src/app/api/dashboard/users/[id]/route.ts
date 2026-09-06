import { remove, update } from "@/lib/api/factory";

export const PATCH = update("users");
export const DELETE = remove("users");
