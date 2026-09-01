"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useId, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { loginAction, registerAction, type ActionState } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-destructive">
      {errors[0]}
    </p>
  );
}

function PasswordInput({
  id,
  name,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  autoComplete: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        autoComplete={autoComplete}
        placeholder="••••••••"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [state, action, pending] = useActionState<ActionState, FormData>(
    loginAction,
    undefined,
  );
  const uid = useId();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormError message={state?.error} />

      <div>
        <Label htmlFor={`${uid}-email`}>Email address</Label>
        <Input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@example.com"
          className="mt-1.5"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          aria-describedby={state?.fieldErrors?.email ? `${uid}-email-err` : undefined}
        />
        <FieldError id={`${uid}-email-err`} errors={state?.fieldErrors?.email} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${uid}-password`}>Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="mt-1.5">
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="current-password"
            invalid={Boolean(state?.fieldErrors?.password)}
            describedBy={state?.fieldErrors?.password ? `${uid}-pw-err` : undefined}
          />
        </div>
        <FieldError id={`${uid}-pw-err`} errors={state?.fieldErrors?.password} />
      </div>

      <div className="flex items-center gap-2.5">
        <Checkbox id={`${uid}-remember`} defaultChecked />
        <Label htmlFor={`${uid}-remember`} className="text-sm font-normal">
          Keep me signed in
        </Label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Signing in…" : "Log in"}
      </Button>

    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    registerAction,
    undefined,
  );
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const uid = useId();

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.error} />

      <fieldset>
        <legend className="text-sm font-medium">I want to</legend>
        <RadioGroup
          name="role"
          value={role}
          onValueChange={(v) => setRole(v as "CUSTOMER" | "VENDOR")}
          className="mt-2 grid grid-cols-2 gap-2"
        >
          {(
            [
              { value: "CUSTOMER", label: "Book stays" },
              { value: "VENDOR", label: "List a property" },
            ] as const
          ).map((o) => (
            <Label
              key={o.value}
              htmlFor={`${uid}-role-${o.value}`}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                role === o.value
                  ? "border-primary bg-secondary/50 ring-1 ring-primary"
                  : "hover:bg-secondary/30",
              )}
            >
              <RadioGroupItem value={o.value} id={`${uid}-role-${o.value}`} />
              {o.label}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <div>
        <Label htmlFor={`${uid}-name`}>Full name</Label>
        <Input
          id={`${uid}-name`}
          name="name"
          required
          autoComplete="name"
          placeholder="e.g. Nusrat Jahan"
          className="mt-1.5"
          aria-invalid={Boolean(state?.fieldErrors?.name)}
        />
        <FieldError id={`${uid}-name-err`} errors={state?.fieldErrors?.name} />
      </div>

      {role === "VENDOR" ? (
        <div>
          <Label htmlFor={`${uid}-business`}>Business or property name</Label>
          <Input
            id={`${uid}-business`}
            name="businessName"
            required
            placeholder="e.g. Sea Pearl Hospitality Ltd."
            className="mt-1.5"
            aria-invalid={Boolean(state?.fieldErrors?.businessName)}
          />
          <FieldError id={`${uid}-biz-err`} errors={state?.fieldErrors?.businessName} />
          <p className="mt-1.5 text-xs text-muted-foreground">
            An admin reviews every vendor before properties go live.
          </p>
        </div>
      ) : null}

      <div>
        <Label htmlFor={`${uid}-email`}>Email address</Label>
        <Input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1.5"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
        />
        <FieldError id={`${uid}-email-err`} errors={state?.fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor={`${uid}-phone`}>Mobile number</Label>
        <Input
          id={`${uid}-phone`}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          className="mt-1.5"
          aria-invalid={Boolean(state?.fieldErrors?.phone)}
        />
        <FieldError id={`${uid}-phone-err`} errors={state?.fieldErrors?.phone} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Booking confirmations are sent here by SMS.
        </p>
      </div>

      <div>
        <Label htmlFor={`${uid}-password`}>Password</Label>
        <div className="mt-1.5">
          <PasswordInput
            id={`${uid}-password`}
            name="password"
            autoComplete="new-password"
            invalid={Boolean(state?.fieldErrors?.password)}
          />
        </div>
        <FieldError id={`${uid}-pw-err`} errors={state?.fieldErrors?.password} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          At least 8 characters, with a number and a letter.
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

