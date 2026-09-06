import { remove, update } from "@/lib/api/factory";

export const PATCH = update("vendors");
export const DELETE = remove("vendors");
