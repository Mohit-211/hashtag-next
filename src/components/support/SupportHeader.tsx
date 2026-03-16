import supportHero from "@/assets/support-hero.jpg";

const SupportHeader = () => {
  return (
    <div className="text-center mb-12 space-y-4">
      <img
        src={supportHero}
        alt="Support illustration"
        className="h-24 w-24 mx-auto object-contain rounded-xl"
      />

      <h1 className="text-3xl lg:text-4xl font-heading font-bold">
        Support & Help Center
      </h1>

      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
        Find answers to common questions about orders, customization, shipping,
        and payments. If you need further assistance, our support team is ready
        to help.
      </p>
    </div>
  );
};

export default SupportHeader;
