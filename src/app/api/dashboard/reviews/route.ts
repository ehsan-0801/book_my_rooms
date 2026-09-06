import { create, readList } from "@/lib/api/factory";

export const GET = readList("reviews");
export const POST = create("reviews");
