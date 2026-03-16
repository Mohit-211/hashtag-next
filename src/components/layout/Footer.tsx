// components/layout/Footer.tsx

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-heading font-bold text-foreground">
              Hashtag<span className="text-primary">Billionaire</span>
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Build your identity.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-heading font-semibold text-foreground">
              Quick Links
            </h4>

            <ul className="space-y-2 text-sm">
              {["Home", "Categories", "Orders", "Saved", "Track Order"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "Home"
                          ? "/"
                          : `/${item.toLowerCase().replace(" ", "-")}`
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-heading font-semibold text-foreground">
              Policies
            </h4>

            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/shippingreturns"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-heading font-semibold text-foreground">
              Contact
            </h4>

            <p className="text-sm text-muted-foreground">
              hello@hashtagbillionaire.com
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 HashtagBillionaire. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
