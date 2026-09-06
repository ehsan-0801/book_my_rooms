import { create, readList } from "@/lib/api/factory";

export const GET = readList("areas");
export const POST = create("areas");
