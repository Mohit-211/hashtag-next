import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSavedItems } from "@/contexts/SavedItemsContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import emptySavedImg from "@/assets/empty-saved.jpg";

const Saved = () => {
  const { savedItems, removeSavedItem } = useSavedItems();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleMoveToCart = (item: (typeof savedItems)[0]) => {
    addItem({
      id: `saved-${item.id}-${Date.now()}`,
      image: item.image,
      name: item.name,
      basePrice: item.basePrice,
      quantity: 1,
      customization: item.customization || {
        placements: [],
        uploadedImage: null,
        uploadedFileName: "",
        uploadFee: 30,
      },
    });
    removeSavedItem(item.id);
    toast({
      title: "Moved to Cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  if (savedItems.length === 0) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg text-center space-y-6">
            <img
              src={emptySavedImg}
              alt="No saved items"
              className="w-28 h-28 mx-auto object-contain opacity-80"
            />
            <h1 className="text-3xl font-heading font-bold text-foreground">
              No Saved Items
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              You haven't saved anything yet. Explore products and keep your
              favorites here for later — whether you want to customize them or
              simply revisit before purchasing.
            </p>
            <Link to="/categories">
              <Button
                variant="hero"
                size="lg"
                className="rounded-lg gap-2 mt-2"
              >
                <ShoppingBag className="h-5 w-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8 lg:py-14">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Saved Items
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mt-2 max-w-2xl">
              These are products you marked to revisit later. You can customize
              them, move them directly to your cart, or remove them anytime.
              Your selections are preserved so you can pick up right where you
              left off.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-secondary">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <button
                    onClick={() => removeSavedItem(item.id)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-background transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span className="absolute top-3 left-3 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Heart
                      className="h-4 w-4 text-primary-foreground"
                      fill="currentColor"
                    />
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-heading font-bold text-foreground">
                      ${item.basePrice}
                    </span>
                  </div>
                  <span className="inline-block text-[10px] font-semibold tracking-wide text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    CUSTOMIZABLE
                  </span>

                  {/* Saved customization indicator */}
                  {item.customization &&
                    item.customization.placements.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.customization.placements.length} placement
                        {item.customization.placements.length > 1 ? "s" : ""}{" "}
                        saved
                      </p>
                    )}

                  <div className="flex flex-col gap-2 pt-1">
                    <Link to="/product" className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-md gap-1.5 text-xs"
                      >
                        Customize & View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full rounded-md gap-1.5 text-xs"
                      onClick={() => handleMoveToCart(item)}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Move to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Saved;
