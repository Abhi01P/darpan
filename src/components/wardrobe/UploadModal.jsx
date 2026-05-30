import { useState } from "react";

export function UploadModal({ isOpen, onClose, onUpload }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("TOPS");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [sizes, setSizes] = useState([]);

  const [sourceFiles, setSourceFiles] = useState([]);
  const [inputMode, setInputMode] = useState("file"); // "file" | "link"
  const [productUrl, setProductUrl] = useState("");
  const [urlPreview, setUrlPreview] = useState(null); // { title, imageUrl }
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

  const handleFetchUrl = async () => {
    if (!productUrl) return alert("Please enter a product URL.");
    setLoadingStatus("Extracting product info...");
    setIsUploading(true);
    try {
      const res = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUrlPreview({ title: data.title, imageUrl: data.imageUrl, price: data.price, rating: data.rating });
      if (!name && data.title) setName(data.title);
      if (!price && data.price) setPrice(data.price.toString());
    } catch (err) {
      alert("Could not extract product info. " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsUploading(false);
      setLoadingStatus("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (inputMode === "link") {
      // URL-based upload
      if (!urlPreview?.imageUrl) return alert("Please fetch a product link first.");
      if (!name) return alert("Please provide a garment name.");

      setIsUploading(true);
      try {
        setLoadingStatus("Uploading to wardrobe...");
        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", category);
        formData.append("price", price || "0");
        formData.append("desc", desc || `Imported from ${new URL(productUrl).hostname}`);
        formData.append("sizes", JSON.stringify(sizes.length ? sizes : ["M"]));
        // For URL mode, pass the image URL as a special field
        formData.append("imageUrl", urlPreview.imageUrl);
        if (urlPreview.rating) {
            formData.append("rating", urlPreview.rating);
        }

        const response = await fetch('/api/wardrobe/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => null);
           throw new Error(errData?.error || "Failed to add item");
        }
        const result = await response.json();

        if (result.success && result.data) {
          onUpload({ ...result.data, image_url: urlPreview.imageUrl });
        } else {
          // Fallback: create local item
          onUpload({
            id: Date.now(),
            name,
            tag: category,
            price: price ? `₹${price}` : "—",
            sizes: sizes.length ? sizes : ["M"],
            desc: desc || `Imported from ${new URL(productUrl).hostname}`,
            image_url: urlPreview.imageUrl,
            model_url: null,
            rating: urlPreview.rating || null,
          });
        }

        // Reset
        resetForm();
        onClose();
      } catch (error) {
        console.error("Error submitting URL item", error);
        alert(error instanceof Error ? error.message : "Failed to add item");
      } finally {
        setIsUploading(false);
        setLoadingStatus("");
      }
    } else {
      // File-based upload (existing flow)
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

        await new Promise(r => setTimeout(r, 800));
        setLoadingStatus("Generating 3D model via Meshy AI...");

        const response = await fetch('/api/wardrobe/generate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => null);
           throw new Error(errData?.error || "Failed to generate model");
        }

        setLoadingStatus("Finalizing...");
        const result = await response.json();

        if (result.success && result.data) {
          onUpload(result.data);
        } else {
          throw new Error("Invalid response");
        }

        resetForm();
        onClose();
      } catch (error) {
        console.error("Error submitting form", error);
        alert(error instanceof Error ? error.message : "Something went wrong during generation.");
      } finally {
        setIsUploading(false);
        setLoadingStatus("");
      }
    }
  };

  const resetForm = () => {
    setName("");
    setCategory("TOPS");
    setPrice("");
    setDesc("");
    setSizes([]);
    setSourceFiles([]);
    setProductUrl("");
    setUrlPreview(null);
    setInputMode("file");
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "10px 0",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: active ? 700 : 400,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    background: active ? "rgba(232,160,176,0.12)" : "transparent",
    color: active ? "var(--pink-nav)" : "rgba(255,255,255,0.35)",
    border: "none",
    borderBottom: active ? "2px solid var(--pink-nav)" : "2px solid transparent",
    fontFamily: "'Jost', sans-serif",
    transition: "all .2s",
  });

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
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--pink-nav)", marginBottom: 4 }}>Add to Wardrobe</div>
            <div className="dw-panel-title" style={{ fontSize: 26 }}>Upload Item</div>
          </div>
          <button className="dw-panel-close" onClick={onClose} style={{ alignSelf: "flex-start" }} disabled={isUploading}>×</button>
        </div>

        {/* TAB TOGGLE: File / Link */}
        <div style={{ display: "flex", marginBottom: 20, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
          <button type="button" style={tabStyle(inputMode === "file")} onClick={() => setInputMode("file")}>
            📸 Upload Photo
          </button>
          <button type="button" style={tabStyle(inputMode === "link")} onClick={() => setInputMode("link")}>
            🔗 Paste Link
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* LINK MODE: URL input + preview */}
          {inputMode === "link" && (
            <div>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)" }}>Product URL</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://www.zara.com/product/..."
                  disabled={isUploading}
                  style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "#fff", borderRadius: 6 }}
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isUploading || !productUrl}
                  style={{
                    padding: "12px 16px",
                    background: "var(--pink-nav)",
                    color: "var(--nav-bg)",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    cursor: "pointer",
                    fontFamily: "'Jost', sans-serif",
                    whiteSpace: "nowrap",
                    opacity: isUploading || !productUrl ? 0.5 : 1,
                  }}
                >
                  Fetch
                </button>
              </div>

              {/* URL Preview */}
              {urlPreview && (
                <div style={{
                  marginTop: 12, display: "flex", gap: 12, padding: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 8
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlPreview.imageUrl} alt="Preview"
                    style={{ width: 80, height: 100, objectFit: "cover", borderRadius: 4, background: "#111" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-inv)", lineHeight: 1.4, marginBottom: 6 }}>
                      {urlPreview.title?.slice(0, 80) || "Product"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--pink-nav)" }}>✓ Image extracted</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FILE MODE: Image upload */}
          {inputMode === "file" && (
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
                background: sourceFiles.length > 0 ? "rgba(232,160,176,0.03)" : "rgba(255,255,255,0.01)",
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
                  <div style={{ fontSize: 13, color: "var(--text-inv)" }}>
                    {sourceFiles.length > 0
                      ? sourceFiles.map(f => f.name).join(", ")
                      : "Drag & drop or click to upload photos"
                    }
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Provide 3-5 angles for best 3D results</div>
                </div>
              </div>
            </div>
          )}

          {/* COMMON FIELDS */}
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
            ) : inputMode === "link" ? "Add to Wardrobe" : "Generate 3D & Upload"}
          </button>
        </form>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
