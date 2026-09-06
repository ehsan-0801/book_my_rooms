import { remove, update } from "@/lib/api/factory";

export const PATCH = update("customers");
export const DELETE = remove("customers");
