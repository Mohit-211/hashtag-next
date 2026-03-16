const OrderItemRow = ({ item }) => {
  const placementCost = item.customization.placements.reduce(
    (s, p) => s + p.cost,
    0
  );

  const uploadCost = item.customization.uploadedImage
    ? item.customization.uploadFee
    : 0;

  const itemTotal =
    (item.basePrice + placementCost + uploadCost) * item.quantity;

  return (
    <div className="flex gap-4">
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 rounded-lg object-cover"
      />

      <div className="flex-1">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium">{item.name}</h3>

          <p className="font-bold">${itemTotal}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          ${item.basePrice} × {item.quantity}
        </p>
      </div>
    </div>
  );
};

export default OrderItemRow;
