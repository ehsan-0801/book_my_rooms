import { create, readList } from "@/lib/api/factory";

export const GET = readList("banners");
export const POST = create("banners");
