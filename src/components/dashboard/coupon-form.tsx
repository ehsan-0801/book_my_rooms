import {
  CheckboxField,
  FormActions,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { ActionForm } from "@/components/dashboard/action-form";
import type { ActionResult } from "@/lib/actions/result";

export interface CouponFormData {
  id?: string;
  code?: string;
  description?: string | null;
  type?: string;
  value?: number;
  maxDiscount?: number | null;
  minSpend?: number | null;
  usageLimit?: number | null;
  startsAt?: Date;
  endsAt?: Date;
  isActive?: boolean;
}

const asDateInput = (d?: Date) => (d ? d.toISOString().slice(0, 10) : "");

export function CouponForm({
  action,
  coupon,
  submitLabel,
}: {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  coupon?: CouponFormData;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-6">
      {coupon?.id ? <input type="hidden" name="id" value={coupon.id} /> : null}

      <FormSection title="Code & discount">
        <TextField
          label="Coupon code"
          name="code"
          required
          defaultValue={coupon?.code}
          placeholder="BMR10"
          className="font-mono uppercase"
          hint="Letters, numbers, - and _ only. Stored uppercase."
        />
        <SelectField
          label="Discount type"
          name="type"
          required
          defaultValue={coupon?.type ?? "PERCENTAGE"}
          options={[
            { value: "PERCENTAGE", label: "Percentage off" },
            { value: "FLAT", label: "Flat amount off (৳)" },
          ]}
        />
        <TextField
          label="Value"
          name="value"
          type="number"
          min={0}
          step="any"
          required
          defaultValue={coupon?.value}
          hint="A percentage (max 100) or a taka amount."
        />
        <TextField
          label="Maximum discount (৳)"
          name="maxDiscount"
          type="number"
          min={0}
          defaultValue={coupon?.maxDiscount ?? undefined}
          hint="Caps a percentage discount. Optional."
        />
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={coupon?.description ?? ""}
          className="min-h-16"
          placeholder="10% off your first booking"
        />
      </FormSection>

      <FormSection title="Conditions & validity">
        <TextField
          label="Minimum spend (৳)"
          name="minSpend"
          type="number"
          min={0}
          defaultValue={coupon?.minSpend ?? undefined}
        />
        <TextField
          label="Usage limit"
          name="usageLimit"
          type="number"
          min={0}
          defaultValue={coupon?.usageLimit ?? undefined}
          hint="Total redemptions allowed. Blank for unlimited."
        />
        <TextField
          label="Starts"
          name="startsAt"
          type="date"
          required
          defaultValue={asDateInput(coupon?.startsAt)}
        />
        <TextField
          label="Ends"
          name="endsAt"
          type="date"
          required
          defaultValue={asDateInput(coupon?.endsAt)}
        />
        <CheckboxField
          label="Active"
          name="isActive"
          defaultChecked={coupon?.isActive ?? true}
          hint="Inactive coupons are rejected at checkout."
        />
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/coupons" />
    </ActionForm>
  );
}
