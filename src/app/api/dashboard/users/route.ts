import { create, readList } from "@/lib/api/factory";

export const GET = readList("users");
export const POST = create("users");
