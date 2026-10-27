import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import ProxyImage from "@/components/ProxyImage";
import type { OrderDetail } from "@/components/orders/OrderCard";

export default function ConfirmationItems({ items }: { items: OrderDetail["items"] }) {
  return (
    <div className="bg-card border rounded-xl p-6 mb-8">
      <p className="text-xs font-bold uppercase text-muted-foreground mb-4">
        Items ({items.length})
      </p>

      <ul className="divide-y divide-border">
        {items.map((item, idx) => (
          <li key={`${item.variant_id}-${idx}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {item.original_image ? (
                <ProxyImage src={item.original_image} alt={item.product_name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.product_id}?variant_id=${item.variant_id}`}
                className="text-sm font-medium leading-snug line-clamp-2 hover:underline underline-offset-4"
              >
                {item.product_name}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {[item.color, item.size, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
              </p>
              {item.customization_config?.print_method && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary-ink">
                  <Sparkles className="h-3 w-3" />
                  {item.customization_config.print_method}
                </span>
              )}
            </div>

            <span className="shrink-0 text-sm font-semibold tabular-nums">
              ${Number(item.total || 0).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
