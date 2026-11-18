/** Stands in for checkout while the cart loads; same frame as CheckoutLayout. */
export default function CheckoutSkeleton() {
  return (
    <section className="py-8 lg:py-12" aria-busy="true">
      <span role="status" className="sr-only">
        Loading your cart…
      </span>

      <div className="container max-w-5xl animate-pulse" aria-hidden="true">
        {/* Progress rail */}
        <div className="flex items-center justify-center gap-6 mb-6 px-6 py-3.5 bg-card border border-border border-b-[3px] border-b-primary">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 rounded-sm bg-muted" />
              <div className="h-2.5 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 lg:gap-8 items-stretch lg:items-start">
          {/* Address step */}
          <div className="lg:col-span-3 bg-card border border-border border-t-[3px] border-t-primary">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="h-10 w-10 rounded-sm bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-56 max-w-full rounded bg-muted" />
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-20 border border-border bg-muted/60" />
              ))}
              <div className="h-11 bg-muted" />
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2 bg-card border border-border border-t-[3px] border-t-primary">
            <div className="h-14 bg-muted border-b border-border" />
            <div className="p-4 space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/3 rounded bg-muted" />
                  </div>
                </div>
              ))}
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="flex justify-between">
                <div className="h-5 w-24 rounded bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
