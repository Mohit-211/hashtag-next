import Image from "next/image";

export default function ConfirmationHeader() {
  return (
    <div className="text-center space-y-4 mb-12">
      <Image
        src="/assets/order-confirmed.jpg"
        alt="Order confirmed"
        width={112}
        height={112}
        className="mx-auto object-contain"
        priority
      />

      <h1 className="text-3xl sm:text-4xl font-heading font-bold">
        Order Confirmed
      </h1>

      <p className="text-muted-foreground max-w-lg mx-auto">
        Your order has been successfully received and is now being processed.
      </p>
    </div>
  );
}
