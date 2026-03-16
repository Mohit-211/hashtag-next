const CartCustomization = ({ item, unitCustomization }: any) => {
  if (
    item.customization.placements.length === 0 &&
    !item.customization.uploadedImage
  ) {
    return null;
  }

  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        Customization
      </p>

      {item.customization.placements.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.customization.placements.map((p: any) => (
            <span
              key={p.id}
              className="text-xs font-medium bg-background border border-border rounded-md px-2.5 py-1"
            >
              {p.label} +${p.cost}
            </span>
          ))}
        </div>
      )}

      {item.customization.uploadedImage && (
        <div className="flex items-center gap-3">
          <img
            src={item.customization.uploadedImage}
            alt="Upload"
            className="w-12 h-12 rounded-md object-cover border"
          />

          <div>
            <p className="text-sm truncate max-w-[200px]">
              {item.customization.uploadedFileName}
            </p>

            <p className="text-xs text-muted-foreground">
              Upload fee +${item.customization.uploadFee}
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
};

export default CartCustomization;
