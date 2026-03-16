// components/product/customization/PricingSummary.tsx

export default function PricingSummary() {
  return (
    <div className="bg-background border rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Base Price</span>
        <span>$799</span>
      </div>

      <div className="border-t pt-2 flex justify-between font-bold">
        <span>Total</span>
        <span className="text-primary">$799</span>
      </div>
    </div>
  );
}
