"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onLogin: () => void;
}

export default function LoginRequired({ onLogin }: Props) {
  return (
    <section className="py-20">
      <div className="container max-w-md text-center space-y-6">
        <User className="h-12 w-12 mx-auto text-muted-foreground" />

        <h1 className="text-2xl font-heading font-bold text-foreground">
          Login Required
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Please log in to access your account settings.
        </p>

        <Button
          variant="hero"
          size="lg"
          className="rounded-lg"
          onClick={onLogin}
        >
          Login
        </Button>
      </div>
    </section>
  );
}
