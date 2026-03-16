const OrderedItemCard = ({ item }) => {
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
    <div className="bg-card border rounded-xl p-5 space-y-3">
      <div className="flex gap-4">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 rounded-lg object-cover"
        />

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">
                Base: ${item.basePrice} × {item.quantity}
              </p>
            </div>

            <p className="font-bold">${itemTotal}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderedItemCard;
