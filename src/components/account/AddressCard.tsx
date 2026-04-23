import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddressCard({ address, onDelete, onDefault, onEdit }: any) {
  return (
    <div className="border p-4 rounded-lg flex justify-between">
      <div>
        <p className="font-semibold">{address.fullName}</p>
        <p>{address.line1}</p>
        <p>{address.city}, {address.state}</p>
        <p>{address.phone}</p>

        {address.isDefault && (
          <span className="text-xs text-green-600">Default</span>
        )}
      </div>

      <div className="flex gap-2">
        {!address.isDefault && (
          <Button size="sm" onClick={() => onDefault(address.id)}>
            Default
          </Button>
        )}

        <Button size="icon" variant="ghost" onClick={() => onEdit(address)}>
          <Pencil />
        </Button>

        <Button size="icon" variant="ghost" onClick={() => onDelete(address.id)}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}