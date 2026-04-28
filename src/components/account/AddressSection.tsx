"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Pencil, Trash2, CircleDot } from "lucide-react";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AddressSection() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await GetAddressApi();
      console.log(res,"res")
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
    setDeletingId(id);
    try {
      await DeleteAddressApi({ id });
      message.success("Address deleted");
      fetchAddresses();
    } catch {
      message.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDefault = async (id: number) => {
    try {
      await UpdateAddressApi({ id, is_default: true });
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
    <div className="p-6 border rounded-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Saved Addresses</h2>
          {addresses.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
              {addresses.length}
            </span>
          )}
        </div>

        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-sm gap-1.5"
            onClick={() => {
              setEditingAddress(null);
              setFormData(emptyAddress);
              setShowForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add address
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <AddressForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveAddress}
            onCancel={() => {
              setShowForm(false);
              setEditingAddress(null);
              setFormData(emptyAddress);
            }}
            editing={!!editingAddress}
          />
        </div>
      )}

      {/* Empty State */}
      {addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No saved addresses</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a delivery address to get started
            </p>
          </div>
        </div>
      )}

      {/* Address Cards */}
      <div className="space-y-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`
              relative rounded-lg border bg-card px-4 py-3.5 transition-all duration-200
              ${addr.isDefault
                ? "border-blue-400/70 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                : "border-border hover:border-border/80 hover:shadow-sm"
              }
              ${deletingId === addr.id ? "opacity-50 scale-[0.99]" : ""}
            `}
          >
            {/* Card Top */}
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-semibold font-mono shrink-0 select-none">
                {getInitials(addr.fullName)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {addr.fullName}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 leading-tight">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {addr.phone}
                </p>
              </div>
            </div>

            {/* Address Lines */}
            <div className="mt-3 pt-3 border-t space-y-1.5 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide w-14 shrink-0 mt-0.5">
                  Line 1
                </span>
                <span className="text-foreground/80">{addr.line1}</span>
              </div>
              {addr.line2 && (
                <div className="flex gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide w-14 shrink-0 mt-0.5">
                    Line 2
                  </span>
                  <span className="text-foreground/80">{addr.line2}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide w-14 shrink-0 mt-0.5">
                  Location
                </span>
                <span className="text-foreground/80">
                  {addr.city}, {addr.state} &mdash; {addr.postalCode}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <button
                onClick={() => handleEdit(addr)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>

              {!addr.isDefault && (
                <button
                  onClick={() => handleDefault(addr.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <CircleDot className="h-3 w-3" />
                  Set default
                </button>
              )}

              <span className="flex-1" />

              <button
                onClick={() => handleDelete(addr.id)}
                disabled={deletingId === addr.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}