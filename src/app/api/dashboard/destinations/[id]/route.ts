import { remove, update } from "@/lib/api/factory";

export const PATCH = update("destinations");
export const DELETE = remove("destinations");
