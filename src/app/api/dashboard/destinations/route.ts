import { create, readList } from "@/lib/api/factory";

export const GET = readList("destinations");
export const POST = create("destinations");
