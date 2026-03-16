import categoryBanner from "@/assets/category-banner.jpg";

const CategoryBanner = () => {
  return (
    <section className="pb-10">
      <div className="container">
        <img
          src={categoryBanner}
          alt="Category banner"
          className="w-full h-48 sm:h-56 md:h-72 object-cover rounded-2xl"
        />
      </div>
    </section>
  );
};

export default CategoryBanner;
