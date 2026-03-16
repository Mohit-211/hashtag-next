import { Checkbox } from "@/components/ui/checkbox";

const placementOptions = [
  { id: "front", label: "Front", cost: 50 },
  { id: "back", label: "Back", cost: 50 },
  { id: "sleeve", label: "Sleeve", cost: 30 },
];

const PlacementSelector = () => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Choose Placement</p>

      <div className="grid grid-cols-2 gap-2">
        {placementOptions.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-3 p-3 rounded-lg border"
          >
            <Checkbox />

            <span className="flex-1 text-sm">{opt.label}</span>

            <span className="text-xs text-muted-foreground">+${opt.cost}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PlacementSelector;
