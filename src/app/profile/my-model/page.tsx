import Link from "next/link";

export default function MyModelPage() {
  return (
    <div style={{ background: "var(--bg, #b8a8b0)", minHeight: "100vh", padding: 40, fontFamily: "'Jost', sans-serif" }}>
      <Link href="/wardrobe" style={{ color: "var(--muted, #6a5860)", textDecoration: "none", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
        ← Back to Wardrobe
      </Link>
      
      <div style={{ maxWidth: 600, margin: "60px auto", background: "rgba(255,255,255,0.4)", padding: 40, borderRadius: 12, textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--text, #1a1018)", marginBottom: 16 }}>
          Digital Replica Studio
        </h1>
        <p style={{ color: "var(--muted, #6a5860)", lineHeight: 1.6, marginBottom: 32 }}>
          Welcome to the Digital Replica setup. Here you will be able to upload your full-body measurements and reference photos so Darpan AI can generate your bespoke 2D and 3D digital mannequins for flawless virtual try-on.
        </p>
        
        <div style={{ background: "rgba(0,0,0,0.05)", padding: 32, borderRadius: 8, border: "1px dashed rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧍</div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "var(--text, #1a1018)" }}>Studio Coming Soon</h3>
          <p style={{ fontSize: 13, color: "var(--muted, #6a5860)" }}>
            The 3D scanning engine is currently being calibrated. Please check back later to generate your replica.
          </p>
        </div>
      </div>
    </div>
  );
}
