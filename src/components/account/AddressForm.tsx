"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";
import { GetCitiesApi, GetStatesApi } from "@/api/operations/location.api";
import { addressLineSchema, nameSchema, phoneSchema, postalCodeSchema } from "@/lib/validation";
import type { AddressFormData } from "@/hooks/useAddresses";

/** A state or city row from the location API. */
interface LocationOption {
  id: number;
  name: string;
}

interface AddressFormProps {
  formData: AddressFormData;
  setFormData: (data: AddressFormData) => void;
  onSave: (data: AddressFormData) => void;
  onCancel: () => void;
  editing: boolean;
  /** True while the save request is in flight — blocks double submits. */
  saving?: boolean;
  /** Inside a dialog that supplies its own frame and title. */
  bare?: boolean;
}

// The location endpoints wrap their list as `all_state` / `all_city`, or return
// it directly, in no particular order — shown alphabetically.
const toOptions = (data: unknown, key: "all_state" | "all_city"): LocationOption[] => {
  const wrapped = (data as Record<string, unknown> | null)?.[key];
  const list = (Array.isArray(wrapped) ? wrapped : Array.isArray(data) ? data : []) as LocationOption[];
  return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name), "en", { sensitivity: "base" }));
};

const US_COUNTRY_ID = 233;

export default function AddressForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  editing,
  saving = false,
  bare = false,
}: AddressFormProps) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);

  const loadCities = async (stateId: number | string) => {
    try {
      const res = await GetCitiesApi(stateId);
      setCities(toOptions(res?.data?.data, "all_city"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    GetStatesApi(US_COUNTRY_ID)
      .then((res) => {
        if (!cancelled) setStates(toOptions(res?.data?.data, "all_state"));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  // Editing an existing address: load the cities for its saved state.
  const editingStateId = editing ? formData.state_id : undefined;
  useEffect(() => {
    if (!editingStateId) return;
    let cancelled = false;
    GetCitiesApi(editingStateId)
      .then((res) => {
        if (!cancelled) setCities(toOptions(res?.data?.data, "all_city"));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [editingStateId]);

  // ✅ State Change
  const handleStateChange = async (stateId: string) => {
    const state = states.find((s) => String(s.id) === String(stateId));

    setFormData({
      ...formData,
      state: state?.name,
      state_id: Number(state?.id),
      city: "",
      city_id: undefined,
    });

    await loadCities(stateId);
  };

  // ✅ City Change
  const handleCityChange = (cityId: string) => {
    const city = cities.find((c) => String(c.id) === String(cityId));

    setFormData({
      ...formData,
      city: city?.name,
      city_id: Number(city?.id),
    });
  };

  // Validation feedback is surfaced via toast only (one message at a time),
  // checked in field order, rather than inline per-field errors.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameResult = nameSchema.safeParse(formData.fullName);
    if (!nameResult.success) {
      toast.error(nameResult.error.issues[0]?.message ?? "Full name is required");
      return;
    }

    const phoneResult = phoneSchema.safeParse(formData.phone);
    if (!phoneResult.success) {
      toast.error(phoneResult.error.issues[0]?.message ?? "Enter a valid phone number");
      return;
    }

    const line1Result = addressLineSchema.safeParse(formData.line1);
    if (!line1Result.success) {
      toast.error(line1Result.error.issues[0]?.message ?? "Address is required");
      return;
    }

    if (!formData.state_id) {
      toast.error("Please select a state");
      return;
    }
    if (!formData.city_id) {
      toast.error("Please select a city");
      return;
    }

    const postalResult = postalCodeSchema.safeParse(formData.postalCode);
    if (!postalResult.success) {
      toast.error(postalResult.error.issues[0]?.message ?? "Enter a valid postal code");
      return;
    }

    onSave(formData);
  };

  const field = (label: string, control: React.ReactNode, wide = false) => (
    <label className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {control}
    </label>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={bare ? "space-y-5" : "space-y-5 rounded-xl border border-border bg-card p-5"}
      noValidate
    >
      {!bare && <h3 className="font-semibold">{editing ? "Edit address" : "Add address"}</h3>}

      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "Full name",
          <input
            value={formData.fullName}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Jane Doe"
            className={inputClass}
          />
        )}
        {field(
          "Phone",
          <input
            type="tel"
            value={formData.phone}
            maxLength={20}
            autoComplete="tel"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        )}
        {field(
          "Street address",
          <input
            value={formData.line1}
            maxLength={200}
            autoComplete="address-line1"
            onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
            placeholder="123 Main St, Suite 4"
            className={inputClass}
          />,
          true
        )}
        {field(
          "State",
          <select
            value={formData.state_id ? Number(formData.state_id) : ""}
            onChange={(e) => handleStateChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        {field(
          "City",
          <select
            value={formData.city_id ? Number(formData.city_id) : ""}
            onChange={(e) => handleCityChange(e.target.value)}
            className={inputClass}
            disabled={!formData.state_id}
          >
            <option value="">{formData.state_id ? "Select city" : "Select a state first"}</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {field(
          "ZIP code",
          <input
            value={formData.postalCode}
            maxLength={12}
            inputMode="numeric"
            autoComplete="postal-code"
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="75201"
            className={inputClass}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Saving…" : editing ? "Save changes" : "Save address"}
        </Button>

      </div>
    </form>
  );
}