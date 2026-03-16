import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ConfirmationActions = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/track">
        <Button variant="hero" size="lg" className="gap-2">
          Track Order <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <Link to="/">
        <Button variant="outline" size="lg">
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
};

export default ConfirmationActions;
