import Link from "next/link";
import Image from "next/image";
import { CONTACT_EMAIL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-secondary-hover bg-secondary text-secondary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <Image
                src="/logo_footer.png"
                alt="HashtagBillionaire"
                width={180}
                height={40}
                className="h-24 w-auto"
              />
            </Link>

          
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
                      className="text-secondary-ink hover:text-foreground hover:underline underline-offset-4 transition-colors"
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
                  className="text-secondary-ink hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-secondary-ink hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/shippingreturns"
                  className="text-secondary-ink hover:text-foreground hover:underline underline-offset-4 transition-colors"
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

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-secondary-ink hover:underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-secondary-hover">
          <p className="text-xs text-secondary-ink text-center">
            © {new Date().getFullYear()} HashtagBillionaire. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
