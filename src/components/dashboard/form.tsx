import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/dashboard/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function FormShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href={backHref}>
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 sm:p-6", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  hint,
  error,
  required,
  full,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <Label htmlFor={name}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  hint,
  error,
  required,
  full,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  full?: boolean;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      full={full}
    >
      <Input id={name} name={name} required={required} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  hint,
  error,
  required,
  full = true,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  full?: boolean;
}) {
  return (
    <Field
      label={label}
      name={name}
      hint={hint}
      error={error}
      required={required}
      full={full}
    >
      <Textarea id={name} name={name} required={required} aria-invalid={Boolean(error)} {...props} />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  hint,
  error,
  required,
  full,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <Field label={label} name={name} hint={hint} error={error} required={required} full={full}>
      {/* A native select keeps these forms usable without JS and avoids
          turning every create/edit page into a client component. */}
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  label,
  name,
  hint,
  defaultChecked,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 sm:col-span-2">
      <input
        id={name}
        name={name}
        type="checkbox"
        value="true"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-input accent-primary"
      />
      <div>
        <Label htmlFor={name} className="font-normal">
          {label}
        </Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export function FormActions({
  submitLabel = "Save",
  cancelHref,
}: {
  submitLabel?: string;
  cancelHref: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button asChild variant="outline">
        <Link href={cancelHref}>Cancel</Link>
      </Button>
      <SubmitButton>{submitLabel}</SubmitButton>
    </div>
  );
}
