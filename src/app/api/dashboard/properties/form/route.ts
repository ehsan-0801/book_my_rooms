import { readList } from "@/lib/api/factory";

/**
 * The reference data a blank "new" form needs — dropdown options with no
 * record to load. The same resource with an id (./[id]) returns that data
 * plus the record being edited.
 */
export const GET = readList("properties/form");
