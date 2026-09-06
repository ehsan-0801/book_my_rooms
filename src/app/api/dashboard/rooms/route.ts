import { create, readList } from "@/lib/api/factory";

export const GET = readList("rooms");
export const POST = create("rooms");
