"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/amenities";

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get("sort") ?? "recommended";

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const next = new URLSearchParams(params.toString());
        if (v === "recommended") next.delete("sort");
        else next.set("sort", v);
        next.delete("page");
        router.push(`/properties?${next.toString()}`, { scroll: false });
      }}
    >
      <SelectTrigger className="w-full sm:w-56" aria-label="Sort results">
        <span className="flex min-w-0 items-center gap-2">
          <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
