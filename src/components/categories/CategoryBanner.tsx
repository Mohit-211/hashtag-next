import Image from "next/image";

export default function CategoryBanner() {
  return (
    <section className="pb-8">
      <div className="container">
        <div className="relative w-full h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-[#e9e5dd] group">
          <Image
            src="/assets/category-banner.jpg"
            alt="Category banner"
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            priority
          />
          {/* Subtle overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

          {/* Optional banner copy */}
          <div className="absolute left-6 bottom-6 sm:left-10 sm:bottom-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 mb-1">
              Customizable
            </p>
            <p className="text-white font-heading text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm">
              Make It Yours
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}