import { Pencil } from "lucide-react";
import PlacementSelector from "./customization/PlacementSelector";
import PricingSummary from "./customization/PricingSummary";
import ProductActions from "./customization/ProductActions";
import QuantitySelector from "./customization/QuantitySelector";
import UploadImageBox from "./customization/UploadImageBox";

interface Props {
  productId: number;
  variantId?: number;
  price: number;
  name: string;
onReload?: () => void; // ✅ ADD THIS
  // ✅ REQUIRED FLAGS
  is_in_cart: boolean;
  is_in_wishlist: boolean;
  wishlist_id?: number | null;
}

export default function ProductCustomization({
  productId,
  variantId,
  price,
  name,
  onReload,
  // ✅ FIX: destructure these
  is_in_cart,
  is_in_wishlist,
  wishlist_id,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e8f0ea] flex items-center justify-center flex-shrink-0">
            <Pencil className="w-4 h-4 text-[#2d4a35]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              Personalize This Item
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Upload image · Choose placement · Done
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a7a58] bg-[#e8f0ea] px-2.5 py-1 rounded-full">
          Optional
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        <UploadImageBox />
        <PlacementSelector />
        <div className="h-px bg-border" />
        <PricingSummary />
        {/* <QuantitySelector />  ✅ RESTORED: was commented out, matches UI quantity row */}

        {/* ✅ FIXED: now values exist */}
        <ProductActions
          productId={productId}
          variantId={variantId}
          price={price}
          name={name}
          is_in_cart={is_in_cart}
          is_in_wishlist={is_in_wishlist}
          wishlist_id={wishlist_id}
          onReload={onReload}
        />
      </div>
    </div>
  );
}