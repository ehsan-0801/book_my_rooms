import { create, readList } from "@/lib/api/factory";

export const GET = readList("properties");
export const POST = create("properties");
