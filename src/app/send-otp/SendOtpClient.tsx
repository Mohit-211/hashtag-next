"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOtpApi } from "@/api/auth/auth.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // ✅ import toast

export default function SendOtpClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email"); // ✅ toast
      return;
    }

    setLoading(true);

    try {
      await sendOtpApi({ email, type: "forgot_password" });

      toast.success("OTP sent to your email!"); // ✅ success toast


      router.push(
        `/verify-otp?type=forgot_password&email=${encodeURIComponent(email)}` // ✅ FIXED email encoding
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Something went wrong"
      ); // ✅ error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Forgot Password
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            variant="hero"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </div>
    </div>
  );
}