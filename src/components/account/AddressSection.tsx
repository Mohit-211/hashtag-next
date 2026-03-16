"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import AddressForm from "./AddressForm";
import AddressCard from "./AddressCard";

import { Address } from "@/data/types";

type AddressFormData = Omit<Address, "id" | "isDefault">;

const emptyAddress: AddressFormData = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function AddressSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress);

  const handleSaveAddress = (data: AddressFormData) => {
    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddress.id ? { ...a, ...data } : a))
      );
    } else {
      const newAddr: Address = {
        ...data,
        id: Date.now().toString(),
        isDefault: addresses.length === 0,
      };

      setAddresses((prev) => [...prev, newAddr]);
    }

    setShowForm(false);
    setEditingAddress(null);
    setFormData(emptyAddress);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);

      // ensure one default remains
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        return filtered.map((a, i) =>
          i === 0 ? { ...a, isDefault: true } : a
        );
      }

      return filtered;
    });
  };

  const handleDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);

    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    });

    setShowForm(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold">Saved Addresses</h2>

          <p className="text-sm text-muted-foreground mt-1">
            Manage your delivery addresses.
          </p>
        </div>

        {!showForm && (
          <Button
            variant="hero"
            size="sm"
            className="rounded-lg"
            onClick={() => {
              setEditingAddress(null);
              setFormData(emptyAddress);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        )}
      </div>

      {showForm && (
        <AddressForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSaveAddress}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          editing={!!editingAddress}
        />
      )}

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-10">
          <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />

          <p className="text-sm text-muted-foreground">
            No saved addresses yet.
          </p>
        </div>
      )}

      <div className="space-y-3">
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
    </div>
  );
}
