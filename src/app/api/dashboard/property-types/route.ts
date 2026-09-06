import { create, readList } from "@/lib/api/factory";

export const GET = readList("property-types");
export const POST = create("property-types");
