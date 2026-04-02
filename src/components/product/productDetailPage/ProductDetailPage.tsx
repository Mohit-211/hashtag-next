"use client";

import { useState } from "react";

const COLORS = [
    { name: "Graphite", hex: "#4a4a4a" },
    { name: "Navy", hex: "#1a2a4a" },
    { name: "Scarlet", hex: "#c0392b" },
    { name: "Silver", hex: "#bdc3c7" },
    { name: "Black", hex: "#111111" },
    { name: "Royal", hex: "#1a3c8f" },
    { name: "Light Blue", hex: "#85c1e9" },
    { name: "White", hex: "#f9f9f9" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

const PRINT_TYPES = ["Embroidery", "DTF", "Screen"];

const PRINT_LOCATIONS = [
    "Left Chest",
    "Center Chest",
    "Right Chest",
    "Full Back",
    "Left Sleeve",
    "Right Sleeve",
    "Hat Front",
    "Hat Side",
    "Hat Back",
    "Full Back (standard)",
    "Full Back (large)",
    "Oversized Back",
    "Other",
];

const RELATED = [
    { name: "A4 Cooling Performance Long Sleeve Tee A4N3165", price: "$8.97", tag: "T-Shirts" },
    { name: "A4 Sprint Performance Tee A4N4422", price: "$5.30", tag: "T-Shirts" },
    { name: "Carhartt Force 1/4-Zip Long Sleeve T-Shirt CT104660", price: "From $68.71", tag: "T-Shirts" },
    { name: "Carhartt Force Short Sleeve Pocket T-Shirt CT104582", price: "From $80.58", tag: "T-Shirts" },
    { name: "Carhartt Force Sun Defender TM Long Sleeve Hooded T-Shirt CT104923", price: "From $78.53", tag: "T-Shirts" },
];

export default function ProductPage() {
    const [selectedColor, setSelectedColor] = useState("Black");
    const [selectedSize, setSelectedSize] = useState("XS");
    const [selectedPrint, setSelectedPrint] = useState("Embroidery");
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [qty, setQty] = useState(1);
    const [mainImg, setMainImg] = useState(0);

    const toggleLocation = (loc: string) => {
        setSelectedLocations((prev) =>
            prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
        );
    };

    const thumbs = [
        { label: "Black", bg: "#111" },
        { label: "Silver", bg: "#bdc3c7" },
    ];

    return (
        <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#f5f5f5", minHeight: "100vh" }}>




            {/* Main Content */}
            <main style={{ margin: "0 auto", padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                {/* Left: Images */}
                <div>
                    <div style={{ background: "#f8f8f8", borderRadius: 10, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", height: 420, marginBottom: 16 }}>
                        <div style={{ width: 300, height: 360, background: mainImg === 0 ? "#111" : "#bdc3c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="180" height="220" viewBox="0 0 180 220" fill="none">
                                <ellipse cx="90" cy="30" rx="35" ry="12" fill={mainImg === 0 ? "#222" : "#ccc"} />
                                <rect x="30" y="28" width="120" height="140" rx="12" fill={mainImg === 0 ? "#1a1a1a" : "#c0c0c0"} />
                                <rect x="5" y="40" width="35" height="90" rx="10" fill={mainImg === 0 ? "#1a1a1a" : "#c0c0c0"} />
                                <rect x="140" y="40" width="35" height="90" rx="10" fill={mainImg === 0 ? "#1a1a1a" : "#c0c0c0"} />
                                <rect x="42" y="168" width="42" height="50" rx="8" fill={mainImg === 0 ? "#1a1a1a" : "#c0c0c0"} />
                                <rect x="96" y="168" width="42" height="50" rx="8" fill={mainImg === 0 ? "#1a1a1a" : "#c0c0c0"} />
                            </svg>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        {thumbs.map((t, i) => (
                            <div key={i} onClick={() => setMainImg(i)} style={{ width: 72, height: 72, background: t.bg, borderRadius: 8, cursor: "pointer", border: mainImg === i ? "2px solid #f5a623" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                                    <ellipse cx="20" cy="7" rx="8" ry="3" fill={t.bg === "#111" ? "#222" : "#aaa"} />
                                    <rect x="5" y="6" width="30" height="30" rx="5" fill={t.bg === "#111" ? "#1a1a1a" : "#b0b0b0"} />
                                    <rect x="0" y="9" width="8" height="20" rx="4" fill={t.bg === "#111" ? "#1a1a1a" : "#b0b0b0"} />
                                    <rect x="32" y="9" width="8" height="20" rx="4" fill={t.bg === "#111" ? "#1a1a1a" : "#b0b0b0"} />
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Details */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.3 }}>A4 AirFlex Long Sleeve Tee A4N3532</h1>
                        <div style={{ background: "#e8001c", color: "#fff", fontWeight: 900, width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>A4</div>
                    </div>

                    <div style={{ fontSize: 12, color: "#888", margin: "6px 0 2px" }}>SKU: 2089741</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: "#111" }}>$12.35</span>
                        <span style={{ fontSize: 13, color: "#27ae60", fontWeight: 600 }}>✓ 19 in stock</span>
                    </div>

                    {/* Color */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Color | <span style={{ fontWeight: 400 }}>{selectedColor}</span></div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {COLORS.map((c) => (
                                <button key={c.name} title={c.name} onClick={() => setSelectedColor(c.name)} style={{ width: 32, height: 32, borderRadius: 6, background: c.hex, border: selectedColor === c.name ? "3px solid #f5a623" : "2px solid #ddd", cursor: "pointer", outline: "none" }} />
                            ))}
                        </div>
                    </div>

                    {/* Size */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Size | <span style={{ fontWeight: 400 }}>{selectedSize}</span></div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {SIZES.map((s) => (
                                <button key={s} onClick={() => setSelectedSize(s)} style={{ padding: "6px 14px", borderRadius: 6, border: selectedSize === s ? "2px solid #111" : "1px solid #ccc", fontWeight: selectedSize === s ? 700 : 400, background: selectedSize === s ? "#111" : "#fff", color: selectedSize === s ? "#fff" : "#333", cursor: "pointer", fontSize: 13 }}>{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div style={{ border: "2px dashed #ddd", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, background: "#fafafa" }}>
                        <span style={{ fontSize: 13, color: "#888" }}>🖼 Drag & Drop Files Here or</span>
                        <button style={{ background: "#2980b9", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Browse Files</button>
                    </div>

                    {/* Print Type */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8001c", marginBottom: 6 }}>Printing Type</div>
                        {PRINT_TYPES.map((p) => (
                            <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 5, cursor: "pointer" }}>
                                <input type="radio" name="print" checked={selectedPrint === p} onChange={() => setSelectedPrint(p)} style={{ accentColor: "#111" }} />
                                {p} <span style={{ background: "#3498db", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>i</span>
                            </label>
                        ))}
                    </div>

                    {/* Print Location */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e8001c", marginBottom: 8 }}>Print Location</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                            {PRINT_LOCATIONS.map((loc) => (
                                <label key={loc} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
                                    <input type="checkbox" checked={selectedLocations.includes(loc)} onChange={() => toggleLocation(loc)} style={{ accentColor: "#111" }} />
                                    {loc}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div style={{ background: "#fffbf0", border: "1px solid #f5a623", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#666" }}>
                        <span style={{ fontWeight: 700, color: "#e8001c" }}>Note: </span>
                        Prices above apply to small chest prints only. For larger print sizes, please place your order via the Inquiry Form on our website. A mockup will be provided via email for approval before production starts.
                    </div>

                    {/* Qty & Buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
                            <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 40, background: "#f5f5f5", border: "none", fontSize: 18, cursor: "pointer" }}>−</button>
                            <span style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{qty}</span>
                            <button onClick={() => setQty(qty + 1)} style={{ width: 36, height: 40, background: "#f5f5f5", border: "none", fontSize: 18, cursor: "pointer" }}>+</button>
                        </div>
                        <button style={{ flex: 1, background: "#f5a623", color: "#fff", border: "none", borderRadius: 6, height: 42, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Add to cart</button>
                        <button style={{ flex: 1, background: "#111", color: "#fff", border: "none", borderRadius: 6, height: 42, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Buy now</button>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Estimated Total: <span>${(12.35 * qty).toFixed(2)}</span></div>

                    <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#888" }}>
                        <span style={{ cursor: "pointer" }}>⇄ Add to compare</span>
                        <span style={{ cursor: "pointer" }}>♡ Add to wishlist</span>
                    </div>

                    {/* Accordions */}
                    {["Shipping and returns", "Product care"].map((label) => (
                        <details key={label} style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 10 }}>
                            <summary style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#333" }}>{label}</summary>
                            <div style={{ fontSize: 13, color: "#888", marginTop: 8, paddingLeft: 8 }}>Details about {label.toLowerCase()} will appear here.</div>
                        </details>
                    ))}
                </div>
            </main>

            {/* Description */}
            <section style={{ maxWidth: 1200, margin: "24px auto", background: "#fff", borderRadius: 12, padding: "28px 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Description</h2>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7 }}>
                    Lighter weight and faster wicking, this long sleeve tee sets the bar for high performance with 4-way stretch and sun protection. 3.4-ounce, 100% performance polyester. Moisture-wicking UPF rating of 50+. 4-way stretch. Reinforced shoulder seams for durability. Double-needle coverstitch on hem. Tear away label.
                </p>
            </section>

            {/* Related Products */}
            <section style={{ maxWidth: 1200, margin: "24px auto", background: "#fff", borderRadius: 12, padding: "28px 40px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Related Products</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18 }}>
                    {RELATED.map((r, i) => (
                        <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s" }}>
                            <div style={{ height: 140, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="60" height="72" viewBox="0 0 60 72" fill="none">
                                    <ellipse cx="30" cy="10" rx="12" ry="4" fill="#ccc" />
                                    <rect x="8" y="8" width="44" height="44" rx="8" fill="#ddd" />
                                    <rect x="0" y="12" width="12" height="28" rx="6" fill="#ddd" />
                                    <rect x="48" y="12" width="12" height="28" rx="6" fill="#ddd" />
                                    <rect x="13" y="52" width="14" height="18" rx="5" fill="#ddd" />
                                    <rect x="33" y="52" width="14" height="18" rx="5" fill="#ddd" />
                                </svg>
                            </div>
                            <div style={{ padding: "10px 12px" }}>
                                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{r.tag}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#222", lineHeight: 1.4, marginBottom: 6, minHeight: 36 }}>{r.name}</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{r.price}</div>
                                <button style={{ marginTop: 8, width: "100%", background: "#f5a623", color: "#fff", border: "none", borderRadius: 5, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Select options</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>


        </div>
    );
}