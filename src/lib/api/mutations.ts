import "server-only";

import type { ActionResult } from "@/lib/actions/result";
import type { Role } from "@/lib/rbac";

import * as admin from "@/lib/actions/admin";
import * as catalog from "@/lib/actions/catalog";
import * as customer from "@/lib/actions/customer";
import * as property from "@/lib/actions/property";
import * as review from "@/lib/actions/review";
import * as room from "@/lib/actions/room";
import * as user from "@/lib/actions/user";
import * as vendor from "@/lib/actions/vendor";

type ServerAction = (
  prev: ActionResult | undefined,
  formData: FormData,
) => Promise<ActionResult>;

/**
 * Every write in the application, addressed as REST verbs on a resource.
 *
 * This is a routing table, not a second copy of the business logic: each
 * entry points at the same server action the dashboard forms already call —
 * the one that validates input and enforces its own role/ownership check.
 * `roles` here is a first pass that lets the dispatcher reject a plainly
 * disallowed caller with 401/403 before ever invoking the action; the action
 * itself remains the real authority (a vendor calling PATCH on a property they
 * don't own still gets rejected there, by id, not by role alone).
 *
 * Shapes:
 *   create — POST   /api/dashboard/<resource>
 *   update — PATCH  /api/dashboard/<resource>/<id>       (id merged into the body)
 *   remove — DELETE /api/dashboard/<resource>/<id>
 *   verbs  — POST   /api/dashboard/<resource>/<id>/<verb> (id merged into the body)
 *            POST   /api/dashboard/<resource>/<verb>      (no URL id — the verb's
 *                                                           own target id, e.g.
 *                                                           propertyId, is a body field)
 */
export interface MutationEntry {
  roles: Role[];
  action: ServerAction;
}

export interface MutationResource {
  create?: MutationEntry;
  update?: MutationEntry;
  remove?: MutationEntry;
  verbs?: Record<string, MutationEntry>;
}

const ADMIN: Role[] = ["ADMIN"];
const ADMIN_VENDOR: Role[] = ["ADMIN", "VENDOR"];
const VENDOR: Role[] = ["VENDOR"];
const CUSTOMER: Role[] = ["CUSTOMER"];
const ANY: Role[] = ["ADMIN", "VENDOR", "CUSTOMER"];

export const MUTATIONS: Record<string, MutationResource> = {
  properties: {
    create: { roles: ADMIN_VENDOR, action: property.createProperty },
    update: { roles: ADMIN_VENDOR, action: property.updateProperty },
    remove: { roles: ADMIN_VENDOR, action: property.deleteProperty },
    verbs: {
      status: { roles: ADMIN, action: admin.setPropertyStatus },
      feature: { roles: ADMIN, action: admin.togglePropertyFeatured },
    },
  },

  rooms: {
    create: { roles: ADMIN_VENDOR, action: room.createRoom },
    update: { roles: ADMIN_VENDOR, action: room.updateRoom },
    remove: { roles: ADMIN_VENDOR, action: room.deleteRoom },
    verbs: {
      rate: { roles: ADMIN_VENDOR, action: room.updateRoomRate },
      discount: { roles: VENDOR, action: catalog.setRoomDiscount },
    },
  },

  availability: {
    verbs: {
      set: { roles: ADMIN_VENDOR, action: vendor.setDateAvailability },
      "bulk-close": { roles: ADMIN_VENDOR, action: vendor.bulkCloseDates },
    },
  },

  vendors: {
    update: { roles: ADMIN, action: user.updateVendorAsAdmin },
    remove: { roles: ADMIN, action: user.deleteVendor },
    verbs: {
      status: { roles: ADMIN, action: admin.setVendorStatus },
      commission: { roles: ADMIN, action: admin.setVendorCommission },
    },
  },

  users: {
    create: { roles: ADMIN, action: user.createUser },
    update: { roles: ADMIN, action: user.updateUser },
    remove: { roles: ADMIN, action: user.deleteUser },
    verbs: {
      active: { roles: ADMIN, action: user.setUserActive },
      password: { roles: ADMIN, action: user.resetUserPassword },
    },
  },

  customers: {
    update: { roles: ADMIN, action: user.updateCustomer },
    remove: { roles: ADMIN, action: user.deleteUser },
    verbs: {
      active: { roles: ADMIN, action: admin.setCustomerActive },
    },
  },

  bookings: {
    verbs: {
      status: { roles: ADMIN_VENDOR, action: vendor.setBookingStatus },
      cancel: { roles: CUSTOMER, action: customer.requestCancellation },
    },
  },

  coupons: {
    create: { roles: ADMIN, action: catalog.createCoupon },
    update: { roles: ADMIN, action: catalog.updateCoupon },
    remove: { roles: ADMIN, action: catalog.deleteCoupon },
    verbs: {
      toggle: { roles: ADMIN, action: catalog.toggleCoupon },
    },
  },

  banners: {
    create: { roles: ADMIN, action: catalog.createBanner },
    update: { roles: ADMIN, action: catalog.updateBanner },
    remove: { roles: ADMIN, action: catalog.deleteBanner },
    verbs: {
      toggle: { roles: ADMIN, action: admin.toggleBanner },
    },
  },

  divisions: {
    create: { roles: ADMIN, action: catalog.createDivision },
    update: { roles: ADMIN, action: catalog.updateDivision },
    remove: { roles: ADMIN, action: catalog.deleteDivision },
  },

  destinations: {
    create: { roles: ADMIN, action: catalog.createDistrict },
    update: { roles: ADMIN, action: catalog.updateDistrict },
    remove: { roles: ADMIN, action: catalog.deleteDistrict },
  },

  areas: {
    create: { roles: ADMIN, action: catalog.createArea },
    update: { roles: ADMIN, action: catalog.updateArea },
    remove: { roles: ADMIN, action: catalog.deleteArea },
  },

  "property-types": {
    create: { roles: ADMIN, action: catalog.createPropertyType },
    update: { roles: ADMIN, action: catalog.updatePropertyType },
    remove: { roles: ADMIN, action: catalog.deletePropertyType },
  },

  amenities: {
    create: { roles: ADMIN, action: catalog.createAmenity },
    update: { roles: ADMIN, action: catalog.updateAmenity },
    remove: { roles: ADMIN, action: catalog.deleteAmenity },
  },

  pages: {
    create: { roles: ADMIN, action: catalog.createContentPage },
    update: { roles: ADMIN, action: catalog.updateContentPage },
    remove: { roles: ADMIN, action: catalog.deleteContentPage },
  },

  reviews: {
    create: { roles: ANY, action: review.createReview },
    update: { roles: ANY, action: review.updateReview },
    remove: { roles: ANY, action: review.deleteReview },
    verbs: {
      moderate: { roles: ADMIN, action: admin.moderateReview },
      reply: { roles: VENDOR, action: vendor.replyToReview },
    },
  },

  refunds: {
    verbs: {
      status: { roles: ADMIN, action: admin.setRefundStatus },
    },
  },

  payouts: {
    // A payout is created by settling a vendor's earned commissions — there's
    // no meaningful update or delete, only the creation event.
    create: { roles: ADMIN, action: admin.createPayout },
  },

  wishlist: {
    verbs: {
      toggle: { roles: CUSTOMER, action: customer.toggleWishlist },
    },
  },

  settings: {
    verbs: {
      profile: { roles: ANY, action: user.updateOwnProfile },
      password: { roles: ANY, action: user.changeOwnPassword },
      "vendor-profile": { roles: VENDOR, action: user.updateVendorProfile },
    },
  },
};

export const isMutationResource = (name: string): name is keyof typeof MUTATIONS =>
  Object.hasOwn(MUTATIONS, name);
