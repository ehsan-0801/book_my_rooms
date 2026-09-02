# Book My Rooms

Multi-vendor hotel, resort and travel booking marketplace for Bangladesh.
Built against the SRS in [`Book My Rooms.md`](./Book%20My%20Rooms.md).

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind CSS v4 · shadcn/ui (Radix) · Prisma 7 · PostgreSQL (Neon) ·
Auth.js v5 · Cloudinary

---

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your own credentials
npx prisma migrate deploy # or `migrate dev` in development
npx prisma db seed        # optional demo catalogue + bookings
npm run dev               # http://localhost:3021
npm run build && npm start  # production, also on 3021
```

### Demo accounts

All three use the password `Password@123`:

| Role | Email |
|---|---|
| Admin | `admin@bookmyrooms.com.bd` |
| Vendor | `vendor.seapearl@bookmyrooms.com.bd` |
| Customer | `nusrat@example.com` |

---

## Architecture

### Route groups

Role never appears in a URL. Two layout groups split the chrome:

```
src/app/
  (storefront)/   public marketplace — site header, footer, WhatsApp CTA
  (dashboard)/    signed-in panels   — sidebar, role badge, user menu
```

All three roles share the **`/dashboard`** namespace. Segments common to more
than one role (`bookings`, `properties`, `reviews`, `settings`) render
different content per role rather than being duplicated under `/admin/...` and
`/vendor/...` — which is what keeps the role out of the URL while avoiding
route collisions.

### Authorisation

Three layers, because middleware alone is not an authorisation boundary:

1. **`src/middleware.ts`** — redirects anonymous visitors away from
   `/dashboard/*`. Runs on the edge, so it holds no Prisma or bcrypt.
2. **`src/lib/auth-guards.ts`** — `requireAdmin()` / `requireVendor()` /
   `requireRole()` in every page's server component.
3. **`src/lib/rbac.ts`** — the real boundary. Every server action and route
   handler resolves the actor here and scopes writes by ownership
   (`assertPropertyAccess`, `assertRoomAccess`, `assertBookingAccess`). A
   vendor's id is taken from their session, never from the submitted form, so
   one vendor cannot reach another's rows.

Financial and administrative mutations write an `AuditLog` row (SRS §66).

### Media

Images upload **straight from the browser to Cloudinary** using a short-lived
signature minted by `/api/upload/sign`; the file never passes through the Next
server. The signing route picks the folder itself (`book_my_rooms/{properties,
rooms,avatars,banners}`), so a caller cannot write outside the project folder,
and it refuses kinds the caller's role isn't allowed to upload.

### Responsive strategy

Mobile-first (SRS §71).

- **Dashboard tables** — `src/components/dashboard/data-table.tsx` takes one
  column definition and renders a real `<table>` from `md` up, and a card per
  row below it. Each column declares where it lands on the card
  (`title` / `meta` / `body` / `footer` / `hide`).
- **Search bar** — stacked → 2×2 grid (`md`) → single row (`lg`).
- **Search results** — filter sheet on mobile, sticky rail from `lg`.
- **Property detail** — sticky bottom bar on mobile, booking sidebar from `lg`.

Deletion is the only action behind a confirmation modal
(`delete-dialog.tsx`) — everything else is reversible and submits directly.
Cascading deletes additionally require typing `DELETE`.

### Feedback: toasts, progress and skeletons

Every mutation returns an `ActionResult` (`src/lib/actions/result.ts`) rather
than throwing. A thrown error in a server action surfaces as an error boundary,
which loses the message and destroys the page the user was working on;
returning a result lets the UI toast it and keep the form intact.

- `success` — it worked
- `warning` — a refusal the user can fix ("cancel the 3 active bookings first")
- `error` — validation or an unexpected failure

`ActionForm` / `ActionButton` (`action-form.tsx`) wrap every mutation and
announce the result. They submit **imperatively** rather than through
`useActionState`: many of these forms delete the row they live in, so the
component unmounts the moment the action revalidates and an effect watching the
returned state would never fire. Awaiting the action inside the submit handler
keeps the continuation alive past unmount, so the toast always lands.

Toasts sit **bottom-right on desktop and top-centre on mobile**
(`app-toaster.tsx`) — a bottom toast on a phone would land under the sticky
booking bar and the WhatsApp button.

A progress bar under the navbar (`navigation-progress.tsx`) covers both route
changes and saves. App Router exposes no router events, so navigation is
detected from both ends: a delegated click on any internal link starts it, and
the pathname changing finishes it. Server actions drive the same store.

Every dashboard route has a `loading.tsx` built from the shared skeletons in
`skeletons.tsx`, shaped like the page it replaces — same table-on-desktop /
cards-on-mobile split as `DataTable`, so nothing jumps when data lands.

> Loading boundaries only appear on client navigation when the route was
> prefetched, and **Next disables prefetching in development**. Verify skeletons
> against `npm run build && npm start`, not `npm run dev`.

---

## Routes

### Storefront
`/` · `/properties` · `/properties/[destination]/[slug]` · `/destinations` ·
`/destinations/[slug]` · `/offers` · `/checkout` · `/booking/[reference]` ·
`/login` · `/register` · `/vendor`

### Dashboard

| Segment | Admin | Vendor | Customer |
|---|:--:|:--:|:--:|
| `/dashboard` | ✅ | ✅ | ✅ |
| `bookings`, `bookings/[id]` | ✅ | ✅ | ✅ |
| `reviews` (+ `new`, `[id]/edit`) | ✅ | ✅ | ✅ |
| `settings` | ✅ | ✅ | ✅ |
| `properties` (+ `new`, `[id]/edit`) | ✅ | ✅ | — |
| `rooms` (+ `new`, `[id]/edit`) | ✅ | ✅ | — |
| `availability` | ✅ | ✅ | — |
| `offers`, `earnings` | — | ✅ | — |
| `vendors`, `vendors/[id]` | ✅ | — | — |
| `customers`, `customers/[id]` | ✅ | — | — |
| `payments`, `commissions` | ✅ | — | — |
| `destinations`, `amenities`, `coupons` | ✅ | — | — |
| `banners`, `pages` | ✅ | — | — |
| `refunds`, `payouts` | ✅ | — | — |
| `areas`, `property-types` | ✅ | — | — |
| `wishlist` | — | — | ✅ |

---

## Environment

`.env` (development) and `.env.prod` (production) are both gitignored;
`.env.example` documents the shape.

Before deploying, generate a fresh `AUTH_SECRET` with `npx auth secret` — the
placeholder in `.env.prod` must not be reused, or session cookies can be forged.

> `prisma` is pinned to `7.10.0`. The `latest` dist-tag on npm currently points
> at an `8.0.0-rc`, so don't run `npm update prisma` without checking.

Prisma 7 keeps the connection URL in [`prisma.config.ts`](./prisma.config.ts)
rather than the schema, and the client connects through `@prisma/adapter-pg`.
Migrations use the **unpooled** Neon URL — pgbouncer can't hold the advisory
locks Prisma Migrate needs.

---

## Credits

Destination photography from **Wikimedia Commons** under CC BY / CC BY-SA;
attribution travels with each record in `src/lib/destinations.ts` and renders on
every destination page, as those licences require. Property and room
photography from **Unsplash**.
