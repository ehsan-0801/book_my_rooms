import { create, readList } from "@/lib/api/factory";

export const GET = readList("divisions");
export const POST = create("divisions");
