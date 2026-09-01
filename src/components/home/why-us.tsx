import { BadgeCheck, Headphones, ShieldCheck, Wallet } from "lucide-react";

const POINTS = [
  {
    Icon: BadgeCheck,
    title: "Every property verified",
    body: "Admins review each listing and its documents before it can appear in search. No ghost hotels.",
  },
  {
    Icon: Wallet,
    title: "The rate you see is the rate you pay",
    body: "Taxes and fees are shown before you reach payment. No surprises at the front desk.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure payment via EPS",
    body: "Card and mobile wallet payments are processed by EPS. We never store your card details.",
  },
  {
    Icon: Headphones,
    title: "Support in Bangla and English",
    body: "Reach a real person on WhatsApp or phone, seven days a week, from 8am to midnight.",
  },
];

export function WhyUs() {
  return (
    <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {POINTS.map(({ Icon, title, body }) => (
        <div key={title}>
          <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 text-base font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
      ))}
    </div>
  );
}
