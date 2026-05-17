import { useState } from "react";

export function UploadModal({ isOpen, onClose, onUpload }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("TOPS");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [sizes, setSizes] = useState([]);

  const [sourceFiles, setSourceFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  if (!isOpen) return null;

  const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36"];
  const CATEGORIES = ["TOPS", "BOTTOMS", "OUTERWEAR", "ACCESSORIES"];

  const toggleSize = (s) => {
    if (sizes.includes(s)) setSizes(sizes.filter((x) => x !== s));
    else setSizes([...sizes, s]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSourceFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !desc) return alert("Please fill all required fields.");
    if (sourceFiles.length === 0) return alert("Please upload at least 1 image.");

    setIsUploading(true);

    try {
      setLoadingStatus("Uploading raw images...");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("desc", desc);
      formData.append("sizes", JSON.stringify(sizes.length ? sizes : ["M"]));

      sourceFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Simulate a small delay before updating status
      await new Promise(r => setTimeout(r, 800));
      setLoadingStatus("Generating 3D model via Meshy AI...");

      const response = await fetch('/api/wardrobe/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate model");
      }

      setLoadingStatus("Finalizing...");
      const result = await response.json();

      // Update local state to reflect UI instantly
      if (result.success && result.data) {
        onUpload(result.data);
      } else {
        throw new Error("Invalid response");
      }

      // Reset form
      setName("");
      setCategory("TOPS");
      setPrice("");
      setDesc("");
      setSizes([]);
      setSourceFiles([]);
      onClose();
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Something went wrong during generation.");
    } finally {
      setIsUploading(false);
      setLoadingStatus("");
    }
  };

  return (
    <>
      <div className="dw-panel-overlay" onClick={onClose} style={{ zIndex: 1000 }} />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "90%",
          maxWidth: "520px",
          background: "var(--sidebar-bg)",
          padding: "32px",
          borderRadius: "16px",
          color: "var(--text-inv)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          border: "1px solid var(--border)",
          animation: "fade-in .2s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 4 }}>Meshy AI Generative Upload</div>
            <div className="dw-panel-title" style={{ fontSize: 26 }}>Add to Wardrobe</div>
          </div>
          <button className="dw-panel-close" onClick={onClose} style={{ alignSelf: "flex-start" }} disabled={isUploading}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Garment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sculpted Silk Tunic"
              disabled={isUploading}
              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "#fff", marginTop: 6, borderRadius: 6 }}
            />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isUploading}
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "#fff", marginTop: 6, borderRadius: 6, WebkitAppearance: "none", MozAppearance: "none" }}
              >
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "var(--nav-bg)", color: "var(--text-inv)" }}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4800"
                disabled={isUploading}
                style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "#fff", marginTop: 6, borderRadius: 6 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
              <span>Source Images (Multiple)</span>
              <span style={{ color: "var(--pink-nav)" }}>{sourceFiles.length} selected</span>
            </label>
            <div style={{
              marginTop: 6,
              border: "1px dashed var(--border)",
              borderRadius: 6,
              padding: "20px",
              textAlign: "center",
              background: "rgba(255,255,255,0.01)",
              position: "relative"
            }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer"
                }}
              />
              <div style={{ pointerEvents: "none" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📸</div>
                <div style={{ fontSize: 13, color: "var(--text-inv)" }}>Drag & drop or click to upload photos</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Provide 3-5 angles for best 3D results</div>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Available Sizes</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {AVAILABLE_SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`dw-size-btn ${sizes.includes(s) ? "active" : ""}`}
                  onClick={() => toggleSize(s)}
                  disabled={isUploading}
                  style={{ color: sizes.includes(s) ? "var(--text-inv)" : "rgba(255,255,255,0.5)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the silhouette, fabric, etc..."
              rows={3}
              disabled={isUploading}
              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "#fff", marginTop: 6, borderRadius: 6, resize: "none", fontFamily: "inherit" }}
            />
          </div>

          <button
            type="submit"
            className="dw-btn-primary"
            style={{
              marginTop: 12,
              padding: "16px",
              fontSize: 12,
              background: isUploading ? "var(--muted)" : "var(--pink-nav)",
              color: "var(--nav-bg)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              transition: "all 0.3s ease"
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, border: "2px solid var(--nav-bg)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                {loadingStatus}
              </>
            ) : "Generate 3D & Upload"}
          </button>
        </form>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
