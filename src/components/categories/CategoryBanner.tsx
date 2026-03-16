import Image from "next/image";

export default function CategoryBanner() {
  return (
    <section className="pb-10">
      <div className="container">
        <div className="relative w-full h-48 sm:h-56 md:h-72 rounded-2xl overflow-hidden">
          <Image
            src="/assets/category-banner.jpg"
            alt="Category banner"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
