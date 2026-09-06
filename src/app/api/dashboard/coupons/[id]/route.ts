import { remove, update } from "@/lib/api/factory";

export const PATCH = update("coupons");
export const DELETE = remove("coupons");
