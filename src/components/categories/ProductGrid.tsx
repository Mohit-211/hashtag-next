import ProductCard from "@/components/ProductCard";

const ProductGrid = ({ products }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((p, i) => (
        <ProductCard key={`${p.name}-${i}`} {...p} />
      ))}
    </div>
  );
};

export default ProductGrid;
