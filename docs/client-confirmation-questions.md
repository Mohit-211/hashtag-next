# HashtagBillionaire: decisions to confirm before we change behavior

**Code reviewed:** website (frontend), branch `main` at commit `5ea83e3`, October 14, 2026.
**Why this exists:** while auditing the site we found rules (prices, fees, file types, checkout steps) where the code does something specific but it isn't clear that's what the business wants. We don't want to "fix" these on our own and get it wrong.

## How to use this document

1. **Backend team first.** For every item, fill in **Backend notes**: what the API does today, and whether the rule should live on the backend, the frontend, or both. Section B is backend-only and has nothing for the client.
2. **Then the client.** Send Section A (without the backend notes) to the client and record each **Client answer**.
3. **Then decide.** Together, fill in **Decision**: the final rule and who builds it.

Priority: **High** means it affects money charged, what gets produced, or legal/contact info. **Medium** affects how the store works. **Low** is polish.

Every item has a suggested owner. Our default is that anything affecting the price charged or what gets produced should be decided and enforced on the backend, with the website only displaying it. Today several of these rules exist only in the website.

---

## Already answered by the client

**Digitizing fee is per design.** The client confirmed the $35 embroidery digitizing fee applies per design when the quantity is small. Item A1 has the follow-up this answer raises.

---

## Summary

| ID | Topic | Priority | Suggested owner |
|----|-------|----------|-----------------|
| A1 | Digitizing fee and price tier when one design goes on several sizes/colors | High | Backend |
| A2 | Digitizing fee when one item has several embroidered locations | High | Backend |
| A3 | Setup fees for other methods (screen print screens, etc.) | High | Backend |
| A4 | Decoration price tables: confirm values, and who maintains them | High | Backend |
| A5 | Hoodie "Full Front" and "Full Back" embroidery currently free | High | Backend + Frontend |
| A6 | "Full Front" on T-shirts and polos is switched off | Medium | Frontend |
| A7 | Which print methods are allowed on which products | Medium | Backend |
| A8 | DTG price ignores how many locations are chosen | High | Backend |
| A9 | Screen print colors: one count for all locations | Medium | Backend |
| A10 | Left vs right sleeve is lost when the order is saved | Medium | Backend |
| A11 | 49% markup on supplier (SAGE) promo prices | High | Backend |
| A12 | Supplier setup fee shown but never charged | High | Backend |
| A13 | Adding a logo to promo products is free | High | Backend |
| A14 | Drinkware print types and second-location fee | Medium | Backend |
| A15 | Default minimum of 100 for promo products | Medium | Backend |
| A16 | How print products (cards, labels, banners) should be ordered | Medium | Both |
| A17 | What artwork production actually receives | High | Backend + Frontend |
| A18 | One design for all chosen print locations? | High | Both |
| A19 | Accepted artwork file types and sizes | High | Both |
| A20 | Generic mockups instead of the real product | Low | Both |
| A21 | Fonts offered for custom text | Low | Frontend |
| A22 | Product options can all be skipped (e.g. hoodie with no size) | High | Backend |
| A23 | Add-on quantity always equals product quantity | Medium | Backend |
| A24 | Pre-made products that aren't manual-supplier | Low | Frontend |
| A25 | Shipping label is bought before the customer pays | High | Backend |
| A26 | Shipping price can change after the label is bought | High | Backend |
| A27 | Sales tax is estimated at a flat 8.25% | High | Backend |
| A28 | Guest checkout | Medium | Both |
| A29 | Customers can't cancel orders | Medium | Both |
| A30 | Unpaid orders are resumed at the next checkout | Medium | Backend |
| A31 | Changing quantity of customized items in the cart | High | Backend |
| A32 | "Handling charge" in the cart | Medium | Backend |
| A33 | Payment methods offered | Low | Both |
| A34 | Where customers land after paying | Low | Frontend |
| A35 | Order tracking for people without an account | Low | Backend |
| A36 | Which states and territories you ship to | Medium | Backend |
| A37 | Phone number rules at sign-up | Low | Both |
| A38 | Email verification before first login | Low | Backend |
| A39 | Contact email addresses don't match (one is misspelled) | High | Frontend |
| A40 | Legal and policy page text | Medium | Frontend |
| A41 | "All Products" opens on an industry picker | Low | Frontend |
| A42 | Price filter stops at $500 | Low | Backend |
| A43 | "Primary / Secondary / Budget" filter | Low | Backend |
| A44 | "Only N left in stock" message | Low | Frontend |
| A45 | Gallery photos and captions | Low | Backend |
| A46 | Back button on the first page goes to Home | Low | Frontend |
| B1–B9 | Backend-only checks (no client input needed) | | Backend |

---

# Section A: Questions for the client

## Pricing and fees

### A1. Digitizing fee and price tier when one design goes on several sizes/colors (High)

**What the site does now:** when a customer adds a design in several sizes or colors in one go, each size/color row is priced separately. A row with 11 pieces or fewer is charged the $35 digitizing fee, and its embroidery price tier comes from that row's quantity alone. All rows added together share the same design.

*Example, left-chest embroidery, decoration only (garment price excluded):*

- 3 sizes × 10 pieces, priced per row: 3 × (10 × $12 + $35) = **$465**
- The same 30 pieces priced as one design: 30 × $10 (24–35 tier), no fee = **$300**

**Question for the client:** You said the fee is per design. Since all rows added together are the same design:

- (a) Should the $35 be charged **once for the design**, not once per size/color?
- (b) Should the embroidery price tier use the **design's total quantity** (30 pieces → the 24–35 tier)?
- (c) If a customer adds the same design to the cart twice, in two separate steps, does that count as one design or two?

**Backend, please confirm:** Do you recalculate the fee and tiers when the item is added to the cart or at order time? If so, what do you group by (cart line, design, order)? To charge per design, each cart line needs a design identifier so lines with the same design can be grouped.

**Suggested owner:** Backend (grouping across cart lines can only be done reliably server-side).

**Backend notes:**
**Client answer:**
**Decision:**

### A2. Digitizing fee when one item has several embroidered locations (High)

**What the site does now:** the $35 fee is charged once per row, however many locations are embroidered. Left chest plus full back (two separate logos to digitize) is still $35.

**Question for the client:** Is the digitizing fee per logo/location, or per item regardless of locations?

**Backend, please confirm:** what the API charges today in this case.

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A3. Setup fees for other methods (High)

**What the site does now:** only embroidery has a setup fee ($35, waived from 12 pieces per row). DTF, DTG and screen print have none. Screen printing usually has a per-color or per-screen setup charge.

**Question for the client:**

- Is $35, waived from 12 pieces, the correct embroidery rule?
- Are there setup fees for screen print (per color? per location?), DTF or DTG?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A4. Decoration price tables: confirm values, and who maintains them (High)

**What the site does now:** all decoration prices are typed into the website code:

- **Embroidery:** per location, 7 quantity tiers (1–11, 12–23, 24–35, 36–71, 72–95, 96–143, 144+).
  - Left/right chest and each sleeve: $12 → $6.
  - Full back standard: $18 → $10.
  - Full back large: $22 → $12.
  - Hat front: $15 → $8.
  - Hat side and hat back arch: $10 → $5.
- **DTF:** per location, $15 → $5 across the same 7 tiers.
- **Screen print:** per location, minimum 12 pieces, 6 tiers. 1 color: $11.19 → $1.87; up to 6 colors: $82.09 → $7.61.
- **DTG:** by style, 4 tiers (1–23, 24–47, 48–99, 100+).
  - Front: $15 → $9.
  - Oversized: $20 → $14.
  - Front & back: $30 → $18.
  - Front & back oversized: $40 → $28.

Changing any price today requires a developer and a new release.

**Question for the client:**

- Are these numbers current and correct?
- How often do prices change?
- Who should be able to change them?

**Backend, please confirm:** Does the API have its own copy of these tables? Can they move into the database/admin so the website reads them from the API, and the backend prices orders from the same source?

**Suggested owner:** Backend (single source of truth). The website should only display prices.

**Backend notes:**
**Client answer:**
**Decision:**

### A5. Hoodie "Full Front" and "Full Back" embroidery is currently free (High)

**What the site does now:** for hoodies the site offers "Full Front" and "Full Back" print locations. The embroidery table has no price for either, so they currently add **$0** when embroidery is chosen. DTF and screen print charge for them like any other location.

**Question for the client:** Should hoodies offer full front and full back embroidery? If so, at what price, the same as T-shirt "Full Back (Standard)" or "(Large)"?

**Suggested owner:** Backend (price) + Frontend (which locations are shown).

**Backend notes:**
**Client answer:**
**Decision:**

### A6. "Full Front" on T-shirts and polos is switched off (Medium)

**What the site does now:** a "Full Front" location exists in the code for T-shirts and polos but is disabled. Its old embroidery price was $18 → $10.

**Question for the client:** Should T-shirts and polos offer a full-front print? With which methods, and at what price?

**Suggested owner:** Frontend (show/hide), with the price from A4.

**Backend notes:**
**Client answer:**
**Decision:**

### A7. Which print methods are allowed on which products (Medium)

**What the site does now:** every apparel product offers all four methods: Embroidery, DTF, Screen print and DTG. That includes hats and polos, even though the site describes DTG as "for 100% cotton tees".

**Question for the client:** Which methods are available for each product type (tees, hoodies, polos, hats, jackets, bags…)? For example, are hats embroidery only?

**Backend, please confirm:** Could each product or category carry its allowed methods and locations, so the site only offers what's possible?

**Suggested owner:** Backend (data), Frontend (display).

**Backend notes:**
**Client answer:**
**Decision:**

### A8. DTG price ignores how many locations are chosen (High)

**What the site does now:** DTG is priced only by the chosen style (Front, Oversized, Front & Back, Front & Back Oversized). The customer can still pick several locations (chest, sleeves, back) and pays the same.

**Question for the client:** How should DTG be priced when more than one location is chosen? Should DTG only allow the locations that match the chosen style?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A9. Screen print colors: one count for all locations (Medium)

**What the site does now:** the customer picks one number of colors (1–6), and every chosen location is charged at that count.

**Question for the client:** Can different locations have different color counts (e.g. 1-color sleeve, 4-color back)?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A10. Left vs right sleeve is lost when the order is saved (Medium)

**What the site does now:**

- T-shirts offer "Left sleeve" and "Right sleeve" separately, but both are sent to the backend as just "SLEEVE", so production can't tell which was chosen.
- Hoodies and polos offer only one "Sleeve".

**Question for the client:** Does production need to know which sleeve? Should hoodies and polos offer both?

**Backend, please confirm:** Can the API accept `SLEEVE_LEFT` and `SLEEVE_RIGHT`?

**Suggested owner:** Backend (stored location), Frontend (send it).

**Backend notes:**
**Client answer:**
**Decision:**

### A11. 49% markup on supplier (SAGE) promo prices (High)

**What the site does now:** promo products priced from the supplier's (SAGE) tier table are multiplied by **1.4925** (about +49%) inside the website before being shown and sent to the cart.

**Question for the client:** Is 1.4925 the correct markup? Is it the same for every promo product and supplier?

**Backend, please confirm:** Does the API apply its own markup? It should be applied in one place, server-side.

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A12. Supplier setup fee shown but never charged (High)

**What the site does now:** when a supplier product has a setup fee, the quantity-pricing panel includes it in its total. The order summary and the price sent to the cart **leave it out**, so the customer sees two different totals and is charged the lower one.

**Question for the client:** Should the supplier's setup fee be charged to the customer? With the markup or without?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A13. Adding a logo to promo products is free (High)

**What the site does now:** customers can add a logo to promo products (pens, bags, drinkware…) at no extra charge. The only exception is drinkware's second-location fee (A14).

**Question for the client:** Is imprinting included in the promo price? Are there charges for full color, extra locations or extra imprint colors?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A14. Drinkware print types and second-location fee (Medium)

**What the site does now:** drinkware offers "Color imprint" or "Laser engraving" at the same price, on front and/or back. The first location is free; the second adds **$8 per piece**.

**Question for the client:** Is $8 per piece correct? Should laser engraving cost differently?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A15. Default minimum of 100 for promo products (Medium)

**What the site does now:** a promo product's minimum quantity comes from the supplier's first price tier, then from the product's own minimum. If neither exists, it defaults to **100**.

**Question for the client:** Is 100 the right fallback, or should products without a minimum allow any quantity?

**Suggested owner:** Backend (each product should carry its minimum).

**Backend notes:**
**Client answer:**
**Decision:**

### A16. How print products (cards, labels, banners) should be ordered (Medium)

**What the site does now:** any product that isn't Apparel or Pre-Made, and isn't set up as a manual-supplier product, goes through the promo "add your logo" flow. That includes business cards, labels & stickers, marketing materials, office & stationery, and signs & banners. These products get no print-specific choices such as paper, size or finish, and no print-ready file upload.

**Question for the client:** How should customers order print products? Upload a finished print-ready file? Choose from options set in the admin? Should every print product be set up as a manual product with options?

**Suggested owner:** Both (product setup in backend/admin, matching ordering screen in frontend).

**Backend notes:**
**Client answer:**
**Decision:**

## Artwork and production

### A17. What artwork production actually receives (High)

**What the site does now:** when a customized item is added to the cart, the only artwork sent to the backend is a **500 × 500 pixel screenshot of the on-screen preview**, logo drawn on a generic grey garment. The following are **not** sent:

- the customer's original logo file
- its size and position
- any custom text, font, color or rotation

**Question for the client:** What does your production team need for each method? For example:

- the original file (vector for embroidery?)
- placement and size in inches
- the text and font as text

**Backend, please confirm:** Where is the artwork stored, and what does the admin/production view show? We'd need the API to accept the original file plus placement details for each location.

**Suggested owner:** Backend (storage and production data) + Frontend (send it).

**Backend notes:**
**Client answer:**
**Decision:**

### A18. One design for all chosen print locations? (High)

**What the site does now:** the customizer has a single design area. The customer can pick several locations (e.g. left chest and full back), but there's only one design, and nothing says which artwork goes where.

**Question for the client:** Is it always the same logo on every chosen location, or can each location have its own design? (This also affects A2.)

**Suggested owner:** Both.

**Backend notes:**
**Client answer:**
**Decision:**

### A19. Accepted artwork file types and sizes (High)

**What the site does now:**

- The customizer accepts any image (PNG, JPG…). It says "max 10MB", but no limit is enforced.
- Manual-supplier products accept **only SVG or AI** files, up to 5 MB each and 5 files, so a customer with only a PNG logo can't upload it.

**Question for the client:** Which file types and sizes are acceptable for each method? Is PNG/JPG fine for DTF and DTG? Does embroidery need vector files?

**Backend, please confirm:** Are file type and size checked server-side? They must be, not only in the browser.

**Suggested owner:** Both (rule enforced on backend, shown on frontend).

**Backend notes:**
**Client answer:**
**Decision:**

### A20. Generic mockups instead of the real product (Low)

**What the site does now:** the customizer previews designs on generic grey garments (tee, hoodie, polo or hat), chosen by guessing from the category name. Other apparel such as jackets and bags falls back to the tee picture, and the actual product photo isn't used.

**Question for the client:** Is a generic preview acceptable, or should customers see their design on the real product?

**Backend, please confirm:** Could products carry a "garment type" (and optionally front/back/side images) instead of the site guessing from category names?

**Suggested owner:** Both.

**Backend notes:**
**Client answer:**
**Decision:**

### A21. Fonts offered for custom text (Low)

**What the site does now:** six fonts are offered: Georgia, Montserrat, Dancing Script, Oswald, Courier New, Impact.

**Question for the client:** Can production reproduce these, especially in embroidery? Should the list change?

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

## Product options

### A22. Product options can all be skipped (High)

**What the site does now:** on manual-supplier products every option is labelled "(optional)", so a customer can skip any of them. For example, a pre-made hoodie can be added to the cart **with no size chosen**.

**Question for the client:** Which options must be chosen before adding to cart (size, always?)?

**Backend, please confirm:** Can customization options get a "required" flag that the website reads and the API validates?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A23. Add-on quantity always equals product quantity (Medium)

**What the site does now:** when a customer picks an add-on with a product, the add-on quantity is set to the product quantity (50 hoodies → 50 add-ons).

**Question for the client:** Is that always right, or are some add-ons one per order (e.g. a single gift box)?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A24. Pre-made products that aren't manual-supplier (Low)

**What the site does now:** every current pre-made product (hoodies and tees) is a manual-supplier product. A separate ordering screen exists for pre-made products that aren't, but it never appears.

**Question for the client:** Will there be pre-made products from other suppliers? If not, we'll remove the unused screen.

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

## Cart and checkout

### A25. Shipping label is bought before the customer pays (High)

**What the site does now:** when the customer clicks "Continue to payment", the order is created and a real carrier shipping label is purchased immediately, before payment. If the customer abandons checkout, the label is already paid for. Custom items may take days to produce, so the label is bought long before the package ships.

**Question for the client:** When should the shipping label be bought: after payment, or when the order is ready to ship?

**Backend, please confirm:** Can label purchase move later in the flow? Do unused labels from abandoned checkouts get voided or refunded?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A26. Shipping price can change after the label is bought (High)

**What the site does now:** the customer picks a shipping rate. When the label is bought, the carrier's actual price replaces it, so the amount charged can differ from the price the customer chose.

**Question for the client:** If the real label costs more or less than the quote, who pays the difference? Should the customer always pay the quoted price?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A27. Sales tax is estimated at a flat 8.25% (High)

**What the site does now:** until the order exists, checkout shows tax at a flat 8.25% (the Dallas, TX rate) for every address. The backend's figure replaces it later.

**Question for the client:** Which states do you collect sales tax in? Should tax be based on the delivery address? Are any customers tax-exempt (e.g. resellers, nonprofits)?

**Backend, please confirm:** How is tax calculated today (rate per destination? a tax service?), and is it applied to shipping? The website should only display the backend's tax.

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A28. Guest checkout (Medium)

**What the site does now:** an account is required to add to cart, save items or check out.

**Question for the client:** Should customers be able to buy without creating an account?

**Suggested owner:** Both (large change on both sides).

**Backend notes:**
**Client answer:**
**Decision:**

### A29. Customers can't cancel orders (Medium)

**What the site does now:** the API has an order-cancel endpoint, but the site has no cancel button.

**Question for the client:** Can customers cancel orders themselves? Until which stage (before production starts?)? Is the refund automatic?

**Suggested owner:** Both (rules on backend, button on frontend).

**Backend notes:**
**Client answer:**
**Decision:**

### A30. Unpaid orders are resumed at the next checkout (Medium)

**What the site does now:** if a customer stops at the payment step, the order stays "unpaid". At their next checkout the site resumes that order with its saved shipping, even if they've changed their cart since.

**Question for the client:** How long should unpaid orders be kept? Should they cancel automatically?

**Backend, please confirm:** What happens to an unpaid order when the cart changes? Is the order rebuilt from the cart, or are the old contents charged?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A31. Changing quantity of customized items in the cart (High)

**What the site does now:** customers can change quantities in the cart for any item, including customized ones, down to 1 piece. That's possible even when the product has a higher minimum (12 for screen print, 100 for many promo items), unless the backend blocks it. A new quantity can also put the item in a different price tier, or make the digitizing fee apply or stop applying.

**Question for the client:** Should quantities of customized items be editable in the cart, or only on the product page?

**Backend, please confirm:** On a cart quantity change, do you enforce the minimum, and reprice the tier and digitizing fee?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A32. "Handling charge" in the cart (Medium)

**What the site does now:** the cart shows a "handling charge" on an item whenever the backend sends one above $1.

**Question for the client:** What is the handling charge, and when should it apply?

**Backend, please confirm:** How is it calculated?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A33. Payment methods offered (Low)

**What the site does now:** card, Google Pay and Cash App Pay (via Square), and PayPal.

**Question for the client:** Are these the right methods? Do you want Apple Pay?

**Suggested owner:** Both.

**Backend notes:**
**Client answer:**
**Decision:**

### A34. Where customers land after paying (Low)

**What the site does now:** after a successful payment the customer is sent to the products page after about 3 seconds. A separate order-confirmation page exists, but nothing links to it.

**Question for the client:** Should customers land on an order confirmation page (order number, summary, "we've emailed you")? Is a confirmation email sent today?

**Suggested owner:** Frontend (page), Backend (email).

**Backend notes:**
**Client answer:**
**Decision:**

### A35. Order tracking for people without an account (Low)

**What the site does now:** Track Order works for logged-in customers only; they see their own orders and tracking numbers. There's no way to look up an order by order number and email.

**Question for the client:** Is tracking by order number and email needed? (It mainly matters if guest checkout, A28, is added.)

**Suggested owner:** Backend (new endpoint).

**Backend notes:**
**Client answer:**
**Decision:**

## Accounts and addresses

### A36. Which states and territories you ship to (Medium)

**What the site does now:** shipping is US-only. The state list also includes:

- uninhabited islands: Baker Island, Howland Island, Jarvis Island, Johnston Atoll, Kingman Reef, Midway Atoll, Wake Island
- territories: Guam, American Samoa and others

**Question for the client:** Which states and territories do you ship to? Military (APO/FPO) addresses? Anything outside the US?

**Backend, please confirm:** Can the states endpoint return only shippable regions?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A37. Phone number rules at sign-up (Low)

**What the site does now:** sign-up requires an exactly 10-digit mobile number. Addresses accept any phone of 7–20 digits.

**Question for the client:** Is a phone number required at sign-up? US numbers only?

**Suggested owner:** Both (same rule on both sides).

**Backend notes:**
**Client answer:**
**Decision:**

### A38. Email verification before first login (Low)

**What the site does now:** new accounts must enter a 4-digit emailed code before they can log in. The code can be resent after 30 seconds.

**Question for the client:** Keep this mandatory?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

## Content and catalog

### A39. Contact email addresses don't match (High)

**What the site does now:** the site shows four different addresses:

- **Footer (every page):** `patrick@hashtagbillioniare.net`. Note "billion**ia**re" is misspelled, and the domain is `.net`.
- **Support page:** `support@hashtagbillionaire.com`
- **Terms:** `legal@hashtagbillionaire.com`
- **Privacy policy:** `privacy@hashtagbillionaire.com`

**Question for the client:** Which addresses should customers see? Does the footer address actually receive mail? If the domain is misspelled, those emails are being lost.

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

### A40. Legal and policy page text (Medium)

**What the site does now:** the Privacy policy, Terms, Shipping & returns, and Refund policy are fixed text inside the website code.

**Question for the client:** Has this text been approved? In particular, what is the returns and refund policy for custom-made items? Should this text be editable from the admin?

**Suggested owner:** Frontend (or Backend if managed from admin).

**Backend notes:**
**Client answer:**
**Decision:**

### A41. "All Products" opens on an industry picker (Low)

**What the site does now:** opening "All Products" with no filter first shows a "pick your industry / use case" screen. The product grid only appears after a choice or a skip.

**Question for the client:** Keep this, or go straight to the product grid?

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

### A42. Price filter stops at $500 (Low)

**What the site does now:** the price filter slider is fixed at $0–$500.

**Question for the client:** Are there, or will there be, products above $500?

**Backend, please confirm:** Could the products endpoint return the actual min/max price for the current filters?

**Suggested owner:** Backend.

**Backend notes:**
**Client answer:**
**Decision:**

### A43. "Primary / Secondary / Budget" filter (Low)

**What the site does now:** after choosing a use case, customers can filter by "Primary", "Secondary" or "Budget".

**Question for the client:** What do these mean to a customer? Are these the right labels?

**Suggested owner:** Backend (data), Frontend (labels).

**Backend notes:**
**Client answer:**
**Decision:**

### A44. "Only N left in stock" message (Low)

**What the site does now:** shows "Only N left in stock — order soon" when stock is 5 or fewer.

**Question for the client:** Show this at all? At what level?

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

### A45. Gallery photos and captions (Low)

**What the site does now:** gallery photos are bundled into the website, and their captions are file names such as "IMG_0357".

**Question for the client:** Should you be able to manage gallery photos and captions from the admin?

**Suggested owner:** Backend (endpoint), Frontend (display).

**Backend notes:**
**Client answer:**
**Decision:**

### A46. Back button on the first page goes to Home (Low)

**What the site does now:** when someone opens a page in a new tab (e.g. a product link), pressing Back takes them to the Home page instead of where they came from.

**Question for the client:** Is that intended?

**Suggested owner:** Frontend.

**Backend notes:**
**Client answer:**
**Decision:**

---

# Section B: Backend-only checks (not for the client)

### B1. Prices sent from the browser (High)

For customized apparel, promo and pre-made items, the add-to-cart request includes prices the browser calculated: `product_price`, `decoration_price`, `digitizing_fee` and `total_price` per line. Manual-supplier products send only IDs and quantities.

**Please confirm:** the API recalculates every price and ignores the browser's values. If it doesn't, anyone can change a price before it's sent.

**Backend notes:**

### B2. Shipping amount sent from the browser (High)

`POST /order` receives `shipping_amount` from the browser.

**Please confirm:** the order uses the backend's own carrier quote for the selected service, never the browser value.

**Backend notes:**

### B3. Google Pay and Cash App Pay request $1.00 (High)

The Square payment request for Google Pay and Cash App Pay is created with a fixed `amount: "1.00"`. Customers see $1.00 in the Google Pay sheet, and Cash App Pay approvals are tied to the requested amount, so charging the real total is likely to fail.

**Please confirm:** what the server charges with these tokens. Can the frontend get the final order total (from the order created at the shipping step) to use in the payment request? Both sides need to change.

**Backend notes:**

### B4. Password rules (Medium)

The site requires 8+ characters, an uppercase letter, a number and a special character.

**Please confirm:** the API enforces the same rules on sign-up and password reset.

**Backend notes:**

### B5. "Not verified" right after verification (Medium)

Right after a customer verifies their email, login sometimes still answers "not verified". The website works around this by retrying login up to 4 times, 0.9 s apart.

**Please confirm/fix:** can the verification be visible immediately (replica lag or caching?) so the retry can be removed?

**Backend notes:**

### B6. Password-reset token in the URL (Medium)

After the reset code is verified, the token is put in the reset page's URL (base64-encoded).

**Please confirm:** the token is single-use and expires quickly (e.g. 15 minutes).

**Backend notes:**

### B7. Upload limits (Medium)

Artwork type and size limits are only checked in the browser (A19).

**Please confirm:** the API enforces type and size limits on every upload endpoint (cart artwork, manual-product artwork, sourcing request).

**Backend notes:**

### B8. Login fails without a `timezone` header (Low)

Calling `POST /user/auth/login` without a `timezone` header fails with a database error in the response: `WHERE parameter "time_zone" has invalid "undefined" value`.

**Please:** default the timezone when the header is missing, and avoid returning raw database errors.

**Backend notes:**

### B9. Address validation (Low)

The site only checks that a ZIP code is 3–12 characters. It isn't checked against the state or city.

**Please confirm:** is the address validated when rates are fetched or the label is bought? A bad address should be reported before payment.

**Backend notes:**
