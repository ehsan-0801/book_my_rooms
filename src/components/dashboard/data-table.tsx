import { cn } from "@/lib/utils";

/**
 * One column definition drives both renderings.
 *
 * Desktop/tablet gets a real `<table>`; mobile gets a card per row, because a
 * seven-column table is unusable on a phone. `mobile` decides where a column
 * lands on the card:
 *   title  — the card heading
 *   meta   — the muted line under the heading
 *   body   — a labelled key/value row (the default)
 *   footer — pinned to the bottom strip (actions, totals)
 *   hide   — desktop only
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  mobile?: "title" | "meta" | "body" | "footer" | "hide";
  align?: "left" | "right";
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: React.ReactNode;
  caption?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  const titleCol = columns.find((c) => c.mobile === "title") ?? columns[0];
  const metaCols = columns.filter((c) => c.mobile === "meta");
  const footerCols = columns.filter((c) => c.mobile === "footer");
  const bodyCols = columns.filter(
    (c) =>
      c !== titleCol &&
      !metaCols.includes(c) &&
      !footerCols.includes(c) &&
      c.mobile !== "hide",
  );

  return (
    <>
      {/* Tablet and desktop */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead className="border-b bg-secondary/40 text-left">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase whitespace-nowrap",
                      c.align === "right" && "text-right",
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-secondary/30">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-3 align-middle",
                        c.align === "right" && "text-right",
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="overflow-hidden rounded-xl border bg-card">
            <div className="p-4">
              <div className="font-medium">{titleCol.cell(row)}</div>
              {metaCols.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  {metaCols.map((c) => (
                    <span key={c.key}>{c.cell(row)}</span>
                  ))}
                </div>
              ) : null}

              {bodyCols.length > 0 ? (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {bodyCols.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        {c.header}
                      </dt>
                      <dd className="mt-0.5 text-sm">{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            {footerCols.length > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-secondary/30 px-4 py-2.5">
                {footerCols.map((c) => (
                  <div key={c.key}>{c.cell(row)}</div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
