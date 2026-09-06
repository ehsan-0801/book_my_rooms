# Book My Rooms — API reference

Every panel, every page, every CRUD operation.

## Conventions

All dashboard endpoints live under one namespace and one dispatcher
([src/app/api/dashboard/[...segments]/route.ts](../src/app/api/dashboard/%5B...segments%5D/route.ts)):

| Shape | Meaning |
| --- | --- |
| `GET /api/dashboard/{resource}` | list |
| `GET /api/dashboard/{resource}/detail/{id}` | one record, detail shape |
| `GET /api/dashboard/{resource}/form/{id}` | one record, edit-form shape (plus the dropdown data that form needs) |
| `POST /api/dashboard/{resource}` | create |
| `PATCH /api/dashboard/{resource}/{id}` | update |
| `DELETE /api/dashboard/{resource}/{id}` | delete |
| `POST /api/dashboard/{resource}/{id}/{verb}` | named action on one record |
| `POST /api/dashboard/{resource}/{verb}` | named action whose target is a body field, not a URL id |

**Auth.** Session cookie (NextAuth). Unauthenticated requests get `401`. Requests
are additionally gated per resource by role, and — for anything a vendor owns —
by record ownership inside the action itself, so a vendor cannot read or write
another vendor's data even where the role matches.

**Request bodies** are JSON. They're bridged to the `FormData` the underlying
actions expect: arrays become repeated fields, objects are JSON-stringified.

**Responses.**

```jsonc
// writes
{ "status": "success" | "warning" | "error", "message": "...", "fieldErrors": { "endsAt": ["Must be after the start date"] } }
// errors from the dispatcher itself
{ "error": "You don't have permission to update that" }
```

| Code | When |
| --- | --- |
| `200` | processed — including a `warning` the server deliberately refused (e.g. "still has 3 active bookings") |
| `201`/`200` | created |
| `401` | not signed in |
| `403` | role not permitted, or vendor account still pending approval |
| `404` | unknown resource or verb |
| `405` | resource has no such operation (e.g. `DELETE` on `wishlist`) |
| `422` | validation failure |

---

# Admin panel

## Overview — `/dashboard`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/overview` | KPI counts, recent bookings, revenue totals |

## Vendors — `/dashboard/vendors`, `/[id]`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/vendors` | list with status + property/booking counts |
| `GET` | `/api/dashboard/vendors/detail/{id}` | one vendor: profile, properties, earnings |
| `PATCH` | `/api/dashboard/vendors/{id}` | update business + bank details |
| `DELETE` | `/api/dashboard/vendors/{id}` | delete vendor |
| `POST` | `/api/dashboard/vendors/{id}/status` | approve / suspend / reject |
| `POST` | `/api/dashboard/vendors/{id}/commission` | set commission rate |

```jsonc
// PATCH body
{ "businessName": "Sea Pearl Ltd", "contactEmail": "a@b.com", "contactPhone": "01700000000",
  "commissionRate": 12, "address": "", "tradeLicenseNo": "", "tinNumber": "",
  "bankName": "", "bankAccountName": "", "bankAccountNo": "" }
// status body: { "status": "APPROVED" | "PENDING" | "SUSPENDED" | "REJECTED" }
// commission body: { "rate": 12 }        // 0–50
```

There is no `POST` create — vendors self-register through the storefront.

## Properties — `/dashboard/properties`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/properties` | list (admin sees all vendors') |
| `GET` | `/api/dashboard/properties/form/{id}` | edit form + types/districts/amenities |
| `POST` | `/api/dashboard/properties` | create |
| `PATCH` | `/api/dashboard/properties/{id}` | update |
| `DELETE` | `/api/dashboard/properties/{id}` | delete |
| `POST` | `/api/dashboard/properties/{id}/status` | publish / reject a submission |
| `POST` | `/api/dashboard/properties/{id}/feature` | toggle homepage feature |

```jsonc
// create / update body
{ "name": "", "typeId": "", "districtId": "", "areaId": "", "category": "HOTEL",
  "shortDescription": "", "description": "", "addressLine": "", "contactPhone": "",
  "contactEmail": "", "website": "", "starRating": 4, "checkInTime": "14:00",
  "checkOutTime": "12:00", "latitude": 0, "longitude": 0, "policies": "", "rules": "",
  "cancellationPolicy": "", "basePrice": 5000,
  "amenityIds": ["id1", "id2"], "images": [{ "url": "", "publicId": "" }],
  "vendorId": "" }   // admin only — which vendor to create it under
// status body: { "status": "PUBLISHED" | "REJECTED", "rejectionReason": "" }
```

## Bookings — `/dashboard/bookings`, `/[id]`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/bookings` | list, filterable by status |
| `GET` | `/api/dashboard/bookings/detail/{id}` | full booking, guest, payment, refund |
| `POST` | `/api/dashboard/bookings/{id}/status` | confirm / check-in / check-out / cancel |

```jsonc
// { "status": "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW" }
```

Bookings are never created or deleted through the dashboard — they originate from
checkout, and cancelling is a status transition so the financial record survives.

## Customers — `/dashboard/customers`, `/[id]`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/customers` | list with booking/spend totals |
| `GET` | `/api/dashboard/customers/detail/{id}` | profile, bookings, reviews |
| `PATCH` | `/api/dashboard/customers/{id}` | update name/email/phone/active |
| `DELETE` | `/api/dashboard/customers/{id}` | delete account |
| `POST` | `/api/dashboard/customers/{id}/active` | enable / disable sign-in |

```jsonc
// PATCH: { "name": "", "email": "", "phone": "", "isActive": true }
// active: { "active": true }
```

## Payments — `/dashboard/payments`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/payments` | transactions with method, status, totals |

Read-only ledger — payment records are written by the checkout/gateway flow.

## Refunds — `/dashboard/refunds`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/refunds` | refund queue |
| `POST` | `/api/dashboard/refunds/{id}/status` | approve / reject / mark processed |

```jsonc
// { "status": "APPROVED" | "REJECTED" | "PROCESSED", "adminNote": "" }
```

Created automatically by a cancellation, so there is no create or delete.

## Commissions — `/dashboard/commissions`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/commissions` | per-vendor commission earned vs. settled |

## Payouts — `/dashboard/payouts`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/payouts` | payout history + outstanding balances |
| `POST` | `/api/dashboard/payouts` | settle a vendor's outstanding balance |

```jsonc
// { "vendorId": "..." }
```

A payout is an immutable settlement record: no update, no delete.

## Destinations — `/dashboard/destinations`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/destinations` | districts + divisions for the picker |
| `GET` | `/api/dashboard/destinations/detail/{id}` | one district |
| `POST` | `/api/dashboard/destinations` | create |
| `PATCH` | `/api/dashboard/destinations/{id}` | update |
| `DELETE` | `/api/dashboard/destinations/{id}` | delete |

```jsonc
// { "name": "", "divisionId": "", "tagline": "", "imageUrl": "", "isPopular": true, "isActive": true }
```

### Divisions (managed inline on this page)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/divisions` | list with district counts |
| `GET` | `/api/dashboard/divisions/detail/{id}` | one division |
| `POST` | `/api/dashboard/divisions` | create — `{ "name": "" }` |
| `PATCH` | `/api/dashboard/divisions/{id}` | rename — `{ "name": "" }` |
| `DELETE` | `/api/dashboard/divisions/{id}` | delete (refused while districts remain) |

## Areas — `/dashboard/areas`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/areas` | list grouped by district |
| `POST` | `/api/dashboard/areas` | create — `{ "districtId": "", "name": "" }` |
| `PATCH` | `/api/dashboard/areas/{id}` | update — `{ "name": "", "isActive": true }` |
| `DELETE` | `/api/dashboard/areas/{id}` | delete |

## Property types — `/dashboard/property-types`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/property-types` | list |
| `GET` | `/api/dashboard/property-types/detail/{id}` | one type |
| `POST` | `/api/dashboard/property-types` | create |
| `PATCH` | `/api/dashboard/property-types/{id}` | update |
| `DELETE` | `/api/dashboard/property-types/{id}` | delete |

```jsonc
// { "name": "Resort", "icon": "Building2", "sortOrder": 1, "isActive": true }
```

## Amenities — `/dashboard/amenities`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/amenities` | list |
| `GET` | `/api/dashboard/amenities/detail/{id}` | one amenity |
| `POST` | `/api/dashboard/amenities` | create |
| `PATCH` | `/api/dashboard/amenities/{id}` | update |
| `DELETE` | `/api/dashboard/amenities/{id}` | delete |

```jsonc
// { "name": "Free Wi-Fi", "icon": "Wifi", "category": "GENERAL", "isFilter": true }
```

## Coupons — `/dashboard/coupons`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/coupons` | list with redemption counts |
| `GET` | `/api/dashboard/coupons/detail/{id}` | one coupon |
| `POST` | `/api/dashboard/coupons` | create |
| `PATCH` | `/api/dashboard/coupons/{id}` | update |
| `DELETE` | `/api/dashboard/coupons/{id}` | delete |
| `POST` | `/api/dashboard/coupons/{id}/toggle` | activate / pause |

```jsonc
{ "code": "BMR10", "description": "", "type": "PERCENTAGE" | "FLAT", "value": 10,
  "maxDiscount": 2000, "minSpend": 5000, "usageLimit": 100,
  "startsAt": "2026-01-01", "endsAt": "2026-12-31", "isActive": true }
```

## Reviews — `/dashboard/reviews`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/reviews` | moderation queue |
| `GET` | `/api/dashboard/reviews/detail/{id}` | one review |
| `POST` | `/api/dashboard/reviews` | create |
| `PATCH` | `/api/dashboard/reviews/{id}` | update |
| `DELETE` | `/api/dashboard/reviews/{id}` | delete |
| `POST` | `/api/dashboard/reviews/{id}/moderate` | approve / reject — `{ "approve": true }` |

## Banners — `/dashboard/banners`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/banners` | list |
| `GET` | `/api/dashboard/banners/detail/{id}` | one banner |
| `POST` | `/api/dashboard/banners` | create |
| `PATCH` | `/api/dashboard/banners/{id}` | update |
| `DELETE` | `/api/dashboard/banners/{id}` | delete |
| `POST` | `/api/dashboard/banners/{id}/toggle` | show / hide |

```jsonc
{ "title": "", "imageUrl": "", "linkUrl": "", "position": "HOME_HERO",
  "sortOrder": 1, "isActive": true, "startsAt": "", "endsAt": "" }
```

## Pages — `/dashboard/pages`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/pages` | list of CMS pages |
| `GET` | `/api/dashboard/pages/detail/{id}` | one page |
| `POST` | `/api/dashboard/pages` | create |
| `PATCH` | `/api/dashboard/pages/{id}` | update |
| `DELETE` | `/api/dashboard/pages/{id}` | delete |

```jsonc
{ "slug": "terms", "title": "", "body": "", "metaTitle": "", "metaDescription": "", "isPublished": true }
```

## Settings — `/dashboard/settings`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/settings` | own profile |
| `POST` | `/api/dashboard/settings/profile` | `{ "name": "", "phone": "", "avatarUrl": "" }` |
| `POST` | `/api/dashboard/settings/password` | `{ "currentPassword": "", "newPassword": "", "confirmPassword": "" }` |

---

# Vendor panel

Every vendor endpoint is scoped to the caller's own `vendorId` inside the action —
passing another vendor's record id is rejected on ownership, not just role. A
vendor whose account is still pending approval gets `403` on everything except
overview and settings.

## Overview — `/dashboard`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/overview` | own bookings, revenue, occupancy |

## My properties — `/dashboard/properties`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/properties` | own properties only |
| `GET` | `/api/dashboard/properties/form/{id}` | edit form + reference data |
| `POST` | `/api/dashboard/properties` | create (submitted for admin approval) |
| `PATCH` | `/api/dashboard/properties/{id}` | update own |
| `DELETE` | `/api/dashboard/properties/{id}` | delete own |

Same body as the admin table above, minus `vendorId` (taken from the session).
`status` and `feature` are admin-only.

## Rooms & rates — `/dashboard/rooms`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/rooms` | rooms across own properties |
| `GET` | `/api/dashboard/rooms/form/{id}` | edit form + amenities |
| `POST` | `/api/dashboard/rooms` | create |
| `PATCH` | `/api/dashboard/rooms/{id}` | update |
| `DELETE` | `/api/dashboard/rooms/{id}` | delete |
| `POST` | `/api/dashboard/rooms/{id}/rate` | price + inventory only |
| `POST` | `/api/dashboard/rooms/{id}/discount` | set discount |

```jsonc
// create / update
{ "propertyId": "", "name": "", "description": "", "bedType": "KING", "maxGuests": 2,
  "maxAdults": 2, "maxChildren": 1, "sizeSqft": 320, "totalUnits": 5, "basePrice": 4500,
  "discountValue": 10, "breakfastIncluded": true, "isRefundable": true, "isActive": true,
  "amenityIds": [], "images": [{ "url": "", "publicId": "" }] }
// rate:     { "basePrice": 4500, "discountValue": 10, "totalUnits": 5 }
// discount: { "roomId": "", "discountValue": 10 }
```

## Availability — `/dashboard/availability`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/availability` | calendar per room |
| `POST` | `/api/dashboard/availability/set` | one date |
| `POST` | `/api/dashboard/availability/bulk-close` | close/open a date range |

```jsonc
// set:        { "roomId": "", "date": "2026-09-20", "unitsOpen": 3, "isClosed": false, "price": 5200 }
// bulk-close: { "roomId": "", "from": "2026-09-20", "to": "2026-09-30", "close": true }
```

Availability rows are upserted per date, so closing a date sets a flag rather
than deleting a record — there is no delete.

## Offers — `/dashboard/offers`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/offers` | own rooms with active discounts |
| `POST` | `/api/dashboard/rooms/{id}/discount` | change a room's discount |

## Bookings — `/dashboard/bookings`, `/[id]`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/bookings` | bookings at own properties |
| `GET` | `/api/dashboard/bookings/detail/{id}` | full booking + guest details |
| `POST` | `/api/dashboard/bookings/{id}/status` | confirm, check in, check out, no-show |

## Earnings — `/dashboard/earnings`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/earnings` | gross, commission, net, payout history |

## Reviews — `/dashboard/reviews`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/reviews` | reviews of own properties |
| `POST` | `/api/dashboard/reviews/{id}/reply` | public reply — `{ "reply": "" }` |

Vendors reply only: they cannot edit, delete or moderate a guest's review.

## Settings — `/dashboard/settings`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/settings` | own profile + business details |
| `POST` | `/api/dashboard/settings/profile` | personal profile |
| `POST` | `/api/dashboard/settings/password` | change password |
| `POST` | `/api/dashboard/settings/vendor-profile` | business + bank details |

```jsonc
// vendor-profile
{ "businessName": "", "contactEmail": "", "contactPhone": "", "address": "",
  "tradeLicenseNo": "", "tinNumber": "", "bankName": "", "bankAccountName": "", "bankAccountNo": "" }
```

Commission rate is deliberately absent — only an admin can set it.

---

# Customer panel

## Overview — `/dashboard`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/overview` | upcoming trips, wishlist and review counts |

## My bookings — `/dashboard/bookings`, `/[id]`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/bookings` | own bookings |
| `GET` | `/api/dashboard/bookings/detail/{id}` | itinerary, payment, refund status |
| `POST` | `/api/dashboard/bookings/{id}/cancel` | request cancellation — `{ "reason": "" }` |

Customers request a cancellation; they cannot set a booking status directly.

## Wishlist — `/dashboard/wishlist`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/wishlist` | saved properties |
| `POST` | `/api/dashboard/wishlist/toggle` | add or remove — `{ "propertyId": "" }` |

One idempotent toggle covers both add and remove, so there is no separate delete.

## My reviews — `/dashboard/reviews`, `/new`, `/[id]/edit`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/reviews` | own reviews |
| `GET` | `/api/dashboard/reviews/detail/{id}` | one own review |
| `POST` | `/api/dashboard/reviews` | write one — requires a completed stay |
| `PATCH` | `/api/dashboard/reviews/{id}` | edit own |
| `DELETE` | `/api/dashboard/reviews/{id}` | delete own |

```jsonc
// create: { "bookingId": "", "rating": 5, "title": "", "comment": "" }
// update: { "rating": 5, "title": "", "comment": "" }
```

## Settings — `/dashboard/settings`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/dashboard/settings` | own profile |
| `POST` | `/api/dashboard/settings/profile` | name, phone, avatar |
| `POST` | `/api/dashboard/settings/password` | change password |

---

# Storefront (public, no auth)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/storefront/search` | search + facet counts |
| `GET` | `/api/storefront/properties/{slug}` | property detail |
| `GET` | `/api/storefront/availability` | live room availability for dates |

# Auth

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/callback/credentials` | sign in |
| `POST` | `/api/auth/signout` | sign out |
| `GET` | `/api/auth/session` | current session |

Registration is a server action on `/register` (customer or vendor).

---

# Operations by resource

| Resource | C | R | U | D | Verbs |
| --- | :-: | :-: | :-: | :-: | --- |
| properties | ✓ | ✓ | ✓ | ✓ | status, feature |
| rooms | ✓ | ✓ | ✓ | ✓ | rate, discount |
| availability | — | ✓ | ✓ | — | set, bulk-close |
| vendors | — | ✓ | ✓ | ✓ | status, commission |
| customers | — | ✓ | ✓ | ✓ | active |
| bookings | — | ✓ | — | — | status, cancel |
| coupons | ✓ | ✓ | ✓ | ✓ | toggle |
| banners | ✓ | ✓ | ✓ | ✓ | toggle |
| divisions | ✓ | ✓ | ✓ | ✓ | — |
| destinations | ✓ | ✓ | ✓ | ✓ | — |
| areas | ✓ | ✓ | ✓ | ✓ | — |
| property-types | ✓ | ✓ | ✓ | ✓ | — |
| amenities | ✓ | ✓ | ✓ | ✓ | — |
| pages | ✓ | ✓ | ✓ | ✓ | — |
| reviews | ✓ | ✓ | ✓ | ✓ | moderate, reply |
| refunds | — | ✓ | — | — | status |
| payouts | ✓ | ✓ | — | — | — |
| wishlist | — | ✓ | — | — | toggle |
| settings | — | ✓ | ✓ | — | profile, password, vendor-profile |
| payments | — | ✓ | — | — | — |
| commissions | — | ✓ | — | — | — |
| earnings | — | ✓ | — | — | — |
| overview | — | ✓ | — | — | — |

A dash is a deliberate omission, not a gap: bookings, payments and refunds are
financial records that are transitioned rather than deleted; vendors and
customers self-register; wishlist and availability use idempotent upserts.
