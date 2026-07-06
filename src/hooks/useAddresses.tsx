import { useState, useCallback } from "react";
import {
  AddAddressApi,
  GetAddressApi,
  UpdateAddressApi,
  DeleteAddressApi,
} from "@/api/operations/address.api";

export type Address = {
  id: number;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  state?: string;
  city?: string;
  state_id?: number;
  city_id?: number;
  isDefault?: boolean;
};

export type AddressFormData = Omit<Address, "id">;

const normalize = (item: any): Address => ({
  id: item.id,
  fullName: item.name,
  phone: item.phone,
  line1: item.address_line1,
  line2: item.address_line2,
  postalCode: item.postal_code,
  state: item.state,
  city: item.city,
  state_id: item.state_id,
  city_id: item.city_id,
  isDefault: item.is_default,
});

const toPayload = (data: AddressFormData) => ({
  name: data.fullName,
  phone: data.phone,
  address_line1: data.line1,
  address_line2: data.line2,
  postal_code: data.postalCode,
  country_id: 233,
  state_id: Number(data.state_id),
  city_id: Number(data.city_id),
  is_default: data.isDefault ? 1 : 0,
});

export function useAddresses(autoLoad = true) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GetAddressApi();
      const list = (res?.data?.data ?? []).map(normalize);
      setAddresses(list);
      return list;
    } catch (err) {
      setError("Failed to load addresses");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAddress = useCallback(
    async (data: AddressFormData, editingId?: number) => {
      setSavingId(editingId ?? "new");
      setError(null);
      try {
        const payload: any = toPayload(data);
        if (editingId) {
          payload.id = editingId;
          await UpdateAddressApi(payload);
        } else {
          await AddAddressApi(payload);
        }
        const list = await fetchAddresses();
        return { success: true, list };
      } catch (err) {
        setError("Something went wrong while saving the address");
        return { success: false, list: addresses };
      } finally {
        setSavingId(null);
      }
    },
    [fetchAddresses, addresses]
  );

  const setDefaultAddress = useCallback(
    async (addr: Address) => {
      setSavingId(addr.id);
      setError(null);
      try {
        await UpdateAddressApi({
          id: addr.id,
          name: addr.fullName,
          phone: addr.phone,
          address_line1: addr.line1,
          address_line2: addr.line2,
          postal_code: addr.postalCode,
          country_id: 233,
          state_id: Number(addr.state_id),
          city_id: Number(addr.city_id),
          is_default: 1,
        });
        await fetchAddresses();
        return true;
      } catch (err) {
        setError("Failed to set default address");
        return false;
      } finally {
        setSavingId(null);
      }
    },
    [fetchAddresses]
  );

  const deleteAddress = useCallback(async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      await DeleteAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err) {
      setError("Failed to delete address");
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  return {
    addresses,
    loading,
    savingId,
    deletingId,
    error,
    fetchAddresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    setAddresses,
  };
}