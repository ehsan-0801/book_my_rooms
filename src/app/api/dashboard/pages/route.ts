import { create, readList } from "@/lib/api/factory";

export const GET = readList("pages");
export const POST = create("pages");
