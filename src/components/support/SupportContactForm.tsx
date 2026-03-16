import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SUBJECTS } from "@/data/supportData";
import { CheckCircle } from "lucide-react";

const SupportContactForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mb-16">
      <div className="bg-card border rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-heading font-bold">Contact Support</h2>

        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-primary" />

            <p className="text-muted-foreground">
              Your message has been received.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Full Name"
              className="input"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Email"
              className="input"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              className="input"
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              <option>Select Subject</option>

              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <textarea
              rows={5}
              placeholder="Your message"
              className="input"
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <Button type="submit" variant="hero">
              Send Message
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportContactForm;
