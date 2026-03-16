import { Mail, Clock } from "lucide-react";

const SupportInfo = () => {
  return (
    <div className="bg-secondary/50 border rounded-xl p-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="flex gap-3">
          <Mail className="h-5 w-5 text-primary" />

          <div>
            <p className="font-semibold">Email Support</p>

            <p className="text-muted-foreground text-sm">
              support@hashtagbillionaire.com
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-primary" />

          <div>
            <p className="font-semibold">Response Time</p>

            <p className="text-muted-foreground text-sm">Within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportInfo;
