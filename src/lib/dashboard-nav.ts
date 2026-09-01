export type NavItem = {
  href: string;
  label: string;
  /** lucide icon name */
  icon: string;
};

export type NavSection = { title?: string; items: NavItem[] };

/**
 * All three roles share the `/dashboard` namespace so no role name ever appears
 * in a URL. Segments that several roles have in common (bookings, properties,
 * reviews, settings) render different content per role — the page decides.
 */
export const DASHBOARD_NAV: Record<"ADMIN" | "VENDOR" | "CUSTOMER", NavSection[]> = {
  ADMIN: [
    { items: [{ href: "/dashboard", label: "Overview", icon: "LayoutDashboard" }] },
    {
      title: "Marketplace",
      items: [
        { href: "/dashboard/vendors", label: "Vendors", icon: "Store" },
        { href: "/dashboard/properties", label: "Properties", icon: "Building2" },
        { href: "/dashboard/bookings", label: "Bookings", icon: "CalendarCheck" },
        { href: "/dashboard/customers", label: "Customers", icon: "Users" },
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/dashboard/payments", label: "Payments", icon: "CreditCard" },
        { href: "/dashboard/commissions", label: "Commissions", icon: "Percent" },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/dashboard/destinations", label: "Destinations", icon: "MapPin" },
        { href: "/dashboard/amenities", label: "Amenities", icon: "Sparkles" },
        { href: "/dashboard/coupons", label: "Coupons", icon: "TicketPercent" },
      ],
    },
    {
      title: "Content",
      items: [
        { href: "/dashboard/reviews", label: "Reviews", icon: "MessageSquareText" },
        { href: "/dashboard/banners", label: "Banners", icon: "Megaphone" },
      ],
    },
    { items: [{ href: "/dashboard/settings", label: "Settings", icon: "Settings" }] },
  ],

  VENDOR: [
    { items: [{ href: "/dashboard", label: "Overview", icon: "LayoutDashboard" }] },
    {
      title: "Inventory",
      items: [
        { href: "/dashboard/properties", label: "My properties", icon: "Building2" },
        { href: "/dashboard/rooms", label: "Rooms & rates", icon: "BedDouble" },
        { href: "/dashboard/availability", label: "Availability", icon: "CalendarRange" },
        { href: "/dashboard/offers", label: "Offers", icon: "TicketPercent" },
      ],
    },
    {
      title: "Business",
      items: [
        { href: "/dashboard/bookings", label: "Bookings", icon: "CalendarCheck" },
        { href: "/dashboard/earnings", label: "Earnings", icon: "Wallet" },
        { href: "/dashboard/reviews", label: "Reviews", icon: "MessageSquareText" },
      ],
    },
    { items: [{ href: "/dashboard/settings", label: "Settings", icon: "Settings" }] },
  ],

  CUSTOMER: [
    { items: [{ href: "/dashboard", label: "Overview", icon: "LayoutDashboard" }] },
    {
      title: "My travel",
      items: [
        { href: "/dashboard/bookings", label: "My bookings", icon: "CalendarCheck" },
        { href: "/dashboard/wishlist", label: "Wishlist", icon: "Heart" },
        { href: "/dashboard/reviews", label: "My reviews", icon: "MessageSquareText" },
      ],
    },
    { items: [{ href: "/dashboard/settings", label: "Settings", icon: "Settings" }] },
  ],
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  VENDOR: "Vendor",
  CUSTOMER: "Traveller",
};
