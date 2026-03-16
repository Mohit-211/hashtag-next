// components/login/AuthCard.tsx

import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-bold tracking-tight">
          Hashtag<span className="text-primary">Billionaire</span>
        </h2>
      </div>

      {children}
    </div>
  );
}
