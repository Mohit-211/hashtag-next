import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Address } from "../../data/types";

interface Props {
  address: Address;
  onDelete: (id: string) => void;
  onDefault: (id: string) => void;
  onEdit: (addr: Address) => void;
}

const AddressCard = ({ address, onDelete, onDefault, onEdit }: Props) => {
  return (
    <div
      className={`border rounded-lg p-4 flex flex-col sm:flex-row gap-3 ${
        address.isDefault ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold">{address.fullName}</p>

          {address.isDefault && (
            <span className="text-[10px] uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Default
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
        </p>

        <p className="text-sm text-muted-foreground">
          {address.city}, {address.state} {address.postalCode}
        </p>

        <p className="text-sm text-muted-foreground">{address.country}</p>

        <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
      </div>

      <div className="flex items-center gap-2">
        {!address.isDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDefault(address.id)}
          >
            Set Default
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={() => onEdit(address)}>
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => onDelete(address.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AddressCard;
