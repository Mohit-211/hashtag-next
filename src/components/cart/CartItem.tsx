import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import CartCustomization from "./CartCustomization";

const CartItem = ({ item }: any) => {
  const { removeItem, updateQuantity } = useCart();

  const placementCost = item.customization.placements.reduce(
    (s: number, p: any) => s + p.cost,
    0
  );

  const uploadCost = item.customization.uploadedImage
    ? item.customization.uploadFee
    : 0;

  const unitCustomization = placementCost + uploadCost;

  const itemTotal = (item.basePrice + unitCustomization) * item.quantity;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex gap-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-24 h-24 rounded-lg object-cover bg-secondary shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                {item.name}
              </h3>

              <p className="text-sm text-muted-foreground mt-0.5">
                Base: ${item.basePrice}
              </p>
            </div>

            <button
              onClick={() => removeItem(item.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <CartCustomization item={item} unitCustomization={unitCustomization} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-lg">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-2 hover:bg-secondary"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>

            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-2 hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <Link to="/product">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </Link>
        </div>

        <p className="font-heading font-bold text-foreground text-lg">
          ${itemTotal}
        </p>
      </div>
    </div>
  );
};

export default CartItem;
