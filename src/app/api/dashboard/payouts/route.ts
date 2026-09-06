import { create, readList } from "@/lib/api/factory";

export const GET = readList("payouts");
export const POST = create("payouts");
