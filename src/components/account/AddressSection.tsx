"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddressForm from "./AddressForm";
import AddressCard from "./AddressCard";
import { message } from "antd";

import {
  AddAddressApi,
  GetAddressApi,
  UpdateAddressApi,
  DeleteAddressApi,
} from "@/api/operations/address.api";

type AddressFormData = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  state_id?: number;
  city_id?: number;
  state?: string;
  city?: string;
  isDefault?: boolean;
};

const emptyAddress: AddressFormData = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  postalCode: "",
  state_id: undefined,
  city_id: undefined,
  state: "",
  city: "",
  isDefault: false,
};

export default function AddressSection() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await GetAddressApi();

      const formatted = res?.data?.data?.map((item: any) => ({
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
      }));

      setAddresses(formatted || []);
    } catch {
      message.error("Failed to load addresses");
    }
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    try {
      const payload: any = {
        name: data.fullName,
        phone: data.phone,
        address_line1: data.line1,
        address_line2: data.line2,
        postal_code: data.postalCode,
        country_id: 233,
        state_id: Number(data.state_id),
        city_id: Number(data.city_id),
        is_default: data.isDefault || false,
      };

      if (editingAddress) {
        payload.id = editingAddress.id;
        await UpdateAddressApi(payload);
        message.success("Address updated");
      } else {
        await AddAddressApi(payload);
        message.success("Address added");
      }

      fetchAddresses();
      setShowForm(false);
      setEditingAddress(null);
      setFormData(emptyAddress);
    } catch {
      message.error("Something went wrong");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await DeleteAddressApi({ id });
      message.success("Address deleted");
      fetchAddresses();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleDefault = async (id: number) => {
    try {
      await UpdateAddressApi({
        id,
        is_default: true,
      });

      message.success("Default updated");
      fetchAddresses();
    } catch {
      message.error("Failed to update default");
    }
  };

  const handleEdit = (addr: any) => {
    setEditingAddress(addr);

    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      postalCode: addr.postalCode,
      state_id: addr.state_id,
      city_id: addr.city_id,
      state: addr.state,
      city: addr.city,
      isDefault: addr.isDefault,
    });

    setShowForm(true);
  };

  return (
    <div className="p-6 border rounded-xl space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-bold">Saved Addresses</h2>

        {!showForm && (
          <Button onClick={() => {
            setEditingAddress(null);
            setFormData(emptyAddress);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </div>

      {showForm && (
        <AddressForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveAddress}
          onCancel={() => setShowForm(false)}
          editing={!!editingAddress}
        />
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-10">
          <MapPin className="mx-auto mb-2" />
          No addresses found
        </div>
      )}

      {addresses.map((addr) => (
        <AddressCard
          key={addr.id}
          address={addr}
          onDelete={handleDelete}
          onDefault={handleDefault}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}