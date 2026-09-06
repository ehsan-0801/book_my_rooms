import { create, readList } from "@/lib/api/factory";

export const GET = readList("amenities");
export const POST = create("amenities");
