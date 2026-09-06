import { create, readList } from "@/lib/api/factory";

export const GET = readList("coupons");
export const POST = create("coupons");
