"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Pencil, Trash2, Loader2, X, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { message } from "antd";
import AddressForm from "./AddressForm";
import { useAddresses, Address, AddressFormData } from "@/hooks/useAddresses";

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
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

type Mode = "manage" | "select";

interface AddressSectionProps {
  /** "manage" = account page: inline form, edit/delete only.
   *  "select" = checkout: pick an address + continue button, modal form. */
  mode?: Mode;
  selectedAddressId?: number | null;
  setSelectedAddressId?: (id: number | null) => void;
  onContinue?: () => void;
  continueLoading?: boolean;
}

export default function AddressSection({
  mode = "manage",
  selectedAddressId = null,
  setSelectedAddressId,
  onContinue,
  continueLoading = false,
}: AddressSectionProps) {
  const {
    addresses,
    loading,
    savingId,
    deletingId,
    fetchAddresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchAddresses().then((list) => {
      if (mode === "select" && list.length > 0 && !selectedAddressId) {
        const def = list.find((a: { isDefault: any; }) => a.isDefault) ?? list[0];
        setSelectedAddressId?.(def.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingAddress(null);
    setFormData(emptyAddress);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({ ...addr });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData(emptyAddress);
    setFormError(null);
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    const { success, list } = await saveAddress(data, editingAddress?.id);
    if (success) {
      if (mode === "manage") {
        message.success(editingAddress ? "Address updated" : "Address added");
      } else {
        const target = editingAddress?.id ?? list[list.length - 1]?.id;
        if (target) setSelectedAddressId?.(target);
      }
      closeForm();
    } else {
      if (mode === "manage") message.error("Something went wrong");
      else setFormError("Something went wrong while saving the address");
    }
  };

  const requestDelete = (id: number) => {
    if (mode === "select") {
      setDeleteTargetId(id);
    } else {
      handleDelete(id);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await deleteAddress(id);
    if (ok) {
      if (mode === "manage") message.success("Address deleted successfully");
      if (selectedAddressId === id) setSelectedAddressId?.(null);
    } else if (mode === "manage") {
      message.error("Failed to delete address");
    }
    setDeleteTargetId(null);
  };

  const handleSetDefault = async (e: React.MouseEvent, addr: Address) => {
    e.stopPropagation();
    if (addr.isDefault || savingId === addr.id) return;

    const ok = await setDefaultAddress(addr);
    if (mode === "manage") {
      if (ok) message.success("Default address updated");
      else message.error("Failed to update default address");
    }
  };

  const isSelect = mode === "select";

  return (
    <div
      className={
        isSelect
          ? "bg-white border border-[#E0DFDB] border-t-[3px] border-t-[#F5D800]"
          : "p-6 border rounded-xl space-y-5"
      }
    >
      {/* ---------- Header ---------- */}
      {isSelect ? (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0DFDB]">
          <div className="h-10 w-10 bg-[#F5D800] flex items-center justify-center shrink-0 rounded-sm">
            <MapPin className="h-5 w-5 text-[#1A1A1A]" />
          </div>
          <div className="flex-1">
            <h2 className="font-condensed font-bold text-lg uppercase tracking-wide text-[#1A1A1A]">
              Delivery Address
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Select where to ship your order</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-[#F5D800] hover:bg-[#E8CE00] text-[#1A1A1A] font-condensed font-bold text-xs uppercase tracking-widest px-3 py-2 rounded-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Address
          </button>
        </div>
      ) : (
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
            <Button size="sm" variant="outline" className="h-8 text-sm gap-1.5" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add address
            </Button>
          )}
        </div>
      )}

      {/* ---------- Inline form (manage mode) ---------- */}
      {!isSelect && showForm && (
        <div className="px-0 border rounded-lg p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <AddressForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveAddress}
            onCancel={closeForm}
            editing={!!editingAddress}
            saving={savingId !== null}
          />
        </div>
      )}

      <div className={isSelect ? "p-5 flex flex-col gap-3" : "space-y-3"}>
        {/* ---------- Loading ---------- */}
        {loading && isSelect && (
          <div className="flex flex-col items-center py-14">
            <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
            <p className="mt-3 font-condensed font-bold text-xs uppercase tracking-widest text-[#6B6B6B]">
              Loading addresses...
            </p>
          </div>
        )}

        {/* ---------- Empty state ---------- */}
        {!loading && addresses.length === 0 && !showForm && (
          isSelect ? (
            <div className="text-center py-10">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-[#CDCCC8]" />
              <p className="font-condensed font-bold uppercase tracking-wide text-[#9A9A9A]">
                No saved addresses
              </p>
              <p className="text-sm text-[#9A9A9A] mt-1">Add an address to continue</p>
            </div>
          ) : (
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
          )
        )}

        {/* ---------- List ---------- */}
        {!loading &&
          addresses.map((addr) => (
            <div
              key={addr.id}
              onClick={isSelect ? () => setSelectedAddressId?.(addr.id) : undefined}
              className={`relative rounded-lg border bg-card px-4 py-3.5 transition-all duration-200 ${
                isSelect ? "cursor-pointer" : ""
              } ${
                (isSelect ? selectedAddressId === addr.id : addr.isDefault)
                  ? "border-blue-400/70 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                  : "border-border hover:border-border/80 hover:shadow-sm"
              } ${deletingId === addr.id ? "opacity-50 scale-[0.99]" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-semibold font-mono shrink-0 select-none">
                  {getInitials(addr.fullName)}
                </div>
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
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{addr.phone}</p>
                </div>
              </div>

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

              <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(addr);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>

                {!addr.isDefault && (
                  <button
                    onClick={(e) => handleSetDefault(e, addr)}
                    disabled={savingId === addr.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CircleDot className="h-3 w-3" />
                    {savingId === addr.id ? "Updating..." : "Set default"}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDelete(addr.id);
                  }}
                  disabled={deletingId === addr.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3 w-3" />
                  {deletingId === addr.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}

        {/* ---------- Continue button (select mode only) ---------- */}
        {isSelect && (
          <button
            onClick={onContinue}
            disabled={!selectedAddressId || continueLoading}
            className="w-full mt-2 py-3.5 bg-[#F5D800] hover:bg-[#E8CE00] text-[#1A1A1A] font-condensed font-bold text-base uppercase tracking-widest rounded-sm disabled:bg-[#F5F4F0] disabled:text-[#CDCCC8] disabled:cursor-not-allowed transition-colors"
          >
            {continueLoading ? "Please wait..." : "Continue to Shipping →"}
          </button>
        )}
      </div>

      {/* ---------- Modal form (select mode only) ---------- */}
      {isSelect && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-sm border border-[#E0DFDB]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0DFDB]">
              <h3 className="font-condensed font-bold text-lg uppercase tracking-wide text-[#1A1A1A]">
                {editingAddress ? "Edit Address" : "New Address"}
              </h3>
              <button onClick={closeForm}>
                <X className="h-5 w-5 text-[#6B6B6B]" />
              </button>
            </div>
            <div className="p-5">
              {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
              <AddressForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSaveAddress}
                onCancel={closeForm}
                editing={!!editingAddress}
                saving={savingId !== null}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------- Delete confirm (select mode only) ---------- */}
      {isSelect && deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm rounded-sm border border-[#E0DFDB] p-5">
            <h3 className="font-condensed font-bold text-lg uppercase tracking-wide text-[#1A1A1A]">
              Delete this address?
            </h3>
            <p className="text-sm text-[#6B6B6B] mt-2">This can't be undone.</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-3 border border-[#E0DFDB] font-condensed font-bold text-xs uppercase tracking-widest rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                disabled={deletingId === deleteTargetId}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-condensed font-bold text-xs uppercase tracking-widest rounded-sm disabled:opacity-60"
              >
                {deletingId === deleteTargetId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}