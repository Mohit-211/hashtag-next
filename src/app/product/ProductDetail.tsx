import Layout from "@/components/Layout";

import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductCustomization from "@/components/product/ProductCustomization";
import ProductAccordion from "@/components/product/ProductAccordion";
import RelatedProducts from "@/components/product/RelatedProducts";

const ProductDetail = () => {
  return (
    <Layout>
      <section className="py-8 lg:py-14">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
            <ProductGallery />

            <div className="space-y-6">
              <ProductInfo />

              <ProductCustomization />
            </div>
          </div>

          <ProductAccordion />

          <RelatedProducts />
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
