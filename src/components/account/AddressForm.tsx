"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";
import { GetCitiesApi, GetStatesApi } from "@/api/operations/location.api";
import { addressLineSchema, nameSchema, phoneSchema, postalCodeSchema } from "@/lib/validation";

export default function AddressForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  editing,
}: any) {
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // ✅ Load States
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const res = await GetStatesApi(233);

      // 🔥 handle both API formats safely
      const list =
        res?.data?.data?.all_state ||
        res?.data?.data ||
        [];

      setStates(list);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Load Cities (Reusable)
  const loadCities = async (stateId: number | string) => {
    try {
      const res = await GetCitiesApi(stateId);

      const list =
        res?.data?.data?.all_city ||
        res?.data?.data ||
        [];

      setCities(list);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ FIX: Load cities on edit
  useEffect(() => {
    if (editing && formData.state_id) {
      loadCities(formData.state_id);
    }
  }, [editing, formData.state_id]);

  // ✅ State Change
  const handleStateChange = async (stateId: string) => {
    const state = states.find((s) => s.id == stateId);

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
    const city = cities.find((c) => c.id == cityId);

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
      toast.error(nameResult.error.issues[0]?.message ?? "Full name is required ⚠️");
      return;
    }

    const phoneResult = phoneSchema.safeParse(formData.phone);
    if (!phoneResult.success) {
      toast.error(phoneResult.error.issues[0]?.message ?? "Enter a valid phone number ⚠️");
      return;
    }

    const line1Result = addressLineSchema.safeParse(formData.line1);
    if (!line1Result.success) {
      toast.error(line1Result.error.issues[0]?.message ?? "Address is required ⚠️");
      return;
    }

    if (!formData.state_id) {
      toast.error("Please select a state ⚠️");
      return;
    }
    if (!formData.city_id) {
      toast.error("Please select a city ⚠️");
      return;
    }

    const postalResult = postalCodeSchema.safeParse(formData.postalCode);
    if (!postalResult.success) {
      toast.error(postalResult.error.issues[0]?.message ?? "Enter a valid postal code ⚠️");
      return;
    }

    onSave(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-5 space-y-4"
      noValidate
    >
      <h3 className="font-semibold">
        {editing ? "Edit Address" : "Add Address"}
      </h3>

      {/* Full Name */}
      <input
        value={formData.fullName}
        maxLength={80}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        placeholder="Full Name"
        className={inputClass}
      />

      {/* Phone */}
      <input
        type="tel"
        value={formData.phone}
        maxLength={20}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Phone"
        className={inputClass}
      />

      {/* Address */}
      <input
        value={formData.line1}
        maxLength={200}
        onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
        placeholder="Address Line 1"
        className={inputClass}
      />

      {/* State */}
      <select
        value={formData.state_id ? Number(formData.state_id) : ""}
        onChange={(e) => handleStateChange(e.target.value)}
        className={inputClass}
      >
        <option value="">Select State</option>
        {states.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* City */}
      <select
        value={formData.city_id ? Number(formData.city_id) : ""}
        onChange={(e) => handleCityChange(e.target.value)}
        className={inputClass}
        disabled={!formData.state_id}
      >
        <option value="">Select City</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Postal Code */}
      <input
        value={formData.postalCode}
        maxLength={12}
        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
        placeholder="Postal Code"
        className={inputClass}
      />

      {/* Buttons */}
      <div className="flex gap-2">
        <Button type="submit">
          {editing ? "Update" : "Save"}
        </Button>

        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}