import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const BENEFITS = [
  "Track every order and reorder in a few clicks",
  "Save products and come back to them anytime",
  "Check out faster with saved addresses",
];

/**
 * Shared shell for every auth screen (login, sign-up, forgot/reset password, email verification):
 * a brand panel on the brand grey beside the form on desktop, form only on
 * mobile.
 */
export default function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="py-10 lg:py-16">
      <div className="container max-w-5xl">
        <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <aside className="hidden flex-col justify-between gap-10 bg-secondary p-10 text-secondary-foreground lg:flex">
            <Link href="/" className="w-fit">
              <Image src="/logo_footer.png" alt="HashtagBillionaire" width={240} height={80} className="h-16 w-auto" priority />
            </Link>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-tight tracking-tight">
                Your logo.
                <br />
                Our craft.
                <br />
                <span className="bg-primary px-1.5 text-primary-foreground">Delivered.</span>
              </h2>
              <ul className="space-y-3">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-secondary-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-secondary-ink">Custom apparel, print &amp; promo products for businesses.</p>
          </aside>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            <Link href="/" className="mb-8 w-fit self-center rounded-lg bg-secondary px-3 py-2 lg:hidden">
              <Image src="/logo_footer.png" alt="HashtagBillionaire" width={180} height={60} className="h-10 w-auto" priority />
            </Link>
            <div className="mx-auto w-full max-w-sm space-y-6">{children}</div>
          </div>
        </div>
        {footer && <div className="mt-6 text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </section>
  );
}
