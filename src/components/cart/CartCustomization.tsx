import Image from "next/image";

type Placement = {
  id: string;
  label: string;
  cost: number;
};

type Customization = {
  placements: Placement[];
  uploadedImage?: string;
  uploadedFileName?: string;
  uploadFee?: number;
};

type CartItem = {
  customization: Customization;
};

interface Props {
  item: CartItem;
  unitCustomization: number;
}

export default function CartCustomization({ item, unitCustomization }: Props) {
  const { customization } = item;

  if (customization.placements.length === 0 && !customization.uploadedImage) {
    return null;
  }

  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Customization
      </p>

      {customization.placements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customization.placements.map((p) => (
            <span
              key={p.id}
              className="text-xs font-medium bg-background border border-border rounded-md px-2.5 py-1"
            >
              {p.label} +${p.cost}
            </span>
          ))}
        </div>
      )}

      {customization.uploadedImage && (
        <div className="flex items-center gap-3">
          <Image
            src={customization.uploadedImage}
            alt="Upload"
            width={48}
            height={48}
            className="w-12 h-12 rounded-md object-cover border"
          />

          <div>
            <p className="text-sm truncate max-w-[200px]">
              {customization.uploadedFileName}
            </p>

            <p className="text-xs text-muted-foreground">
              Upload fee +${customization.uploadFee ?? 0}
            </p>
          </div>
        </div>
      )}

      {unitCustomization > 0 && (
        <p className="text-sm text-muted-foreground">
          Customization per unit:
          <span className="font-medium text-foreground">
            +${unitCustomization}
          </span>
        </p>
      )}
    </div>
  );
}
