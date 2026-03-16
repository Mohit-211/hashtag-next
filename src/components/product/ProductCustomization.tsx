import UploadImageBox from "./customization/UploadImageBox";
import PlacementSelector from "./customization/PlacementSelector";
import PricingSummary from "./customization/PricingSummary";
import QuantitySelector from "./customization/QuantitySelector";
import ProductActions from "./customization/ProductActions";

const ProductCustomization = () => {
  return (
    <div className="border rounded-xl p-5 space-y-6 bg-secondary/40">
      <UploadImageBox />

      <PlacementSelector />

      <PricingSummary />

      <QuantitySelector />

      <ProductActions />
    </div>
  );
};

export default ProductCustomization;
