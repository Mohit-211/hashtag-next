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
}

export default function ProductCustomization({
  productId,
  variantId,
  price,
  name,
}: Props) {
  return (
    <div className="border rounded-xl p-5 space-y-6 bg-secondary/40">
      <UploadImageBox />
      <PlacementSelector />
      <PricingSummary />
      {/* <QuantitySelector/> */}

      <ProductActions
        productId={productId}
        variantId={variantId!}
        price={price}
        name={name}
      />
    </div>
  );
}