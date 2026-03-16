import orderConfirmedImg from "@/assets/order-confirmed.jpg";

const ConfirmationHeader = () => {
  return (
    <div className="text-center space-y-4 mb-12">
      <img
        src={orderConfirmedImg}
        alt="Order confirmed"
        className="w-28 h-28 mx-auto object-contain"
      />

      <h1 className="text-3xl sm:text-4xl font-heading font-bold">
        Order Confirmed
      </h1>

      <p className="text-muted-foreground max-w-lg mx-auto">
        Your order has been successfully received and is now being processed.
      </p>
    </div>
  );
};

export default ConfirmationHeader;
