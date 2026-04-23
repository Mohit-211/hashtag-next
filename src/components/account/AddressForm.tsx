"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/data/constants";
import { GetCitiesApi, GetStatesApi } from "@/api/operations/location.api";

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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}
      className="border rounded-lg p-5 space-y-4"
    >
      <h3 className="font-semibold">
        {editing ? "Edit Address" : "Add Address"}
      </h3>

      {/* Full Name */}
      <input
        value={formData.fullName}
        onChange={(e) =>
          setFormData({ ...formData, fullName: e.target.value })
        }
        placeholder="Full Name"
        className={inputClass}
        required
      />

      {/* Phone */}
      <input
        value={formData.phone}
        onChange={(e) =>
          setFormData({ ...formData, phone: e.target.value })
        }
        placeholder="Phone"
        className={inputClass}
        required
      />

      {/* Address */}
      <input
        value={formData.line1}
        onChange={(e) =>
          setFormData({ ...formData, line1: e.target.value })
        }
        placeholder="Address Line 1"
        className={inputClass}
        required
      />

      {/* State */}
      <select
        value={formData.state_id ? Number(formData.state_id) : ""}
        onChange={(e) => handleStateChange(e.target.value)}
        className={inputClass}
        required
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
        required
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
        onChange={(e) =>
          setFormData({ ...formData, postalCode: e.target.value })
        }
        placeholder="Postal Code"
        className={inputClass}
        required
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