import { useState, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');

:root {
  --pink:       #f06292;
  --pink-light: #fce4ec;
  --pink-mid:   #f48fb1;
  --rose:       #e91e63;
  --bg:         #fdf8f8;
  --surface:    #ffffff;
  --border:     #f0e4e8;
  --text:       #2d1f26;
  --muted:      #9e7d8a;
  --dark:       #1a1020;
  --shadow-sm:  0 2px 12px rgba(240,98,146,.10);
  --shadow-md:  0 6px 32px rgba(240,98,146,.14);
  --radius-lg:  20px;
  --radius-md:  14px;
  --radius-sm:  10px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.dto-wrap {
  font-family: 'Nunito Sans', sans-serif;
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 48px;
}

/* ── PAGE HEADER ── */
.dto-page-header { max-width: 1080px; width: 100%; margin-bottom: 24px; }
.dto-breadcrumb {
  font-size: 11px; font-weight: 600; letter-spacing: .8px;
  text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
}
.dto-breadcrumb span { color: var(--pink); }
.dto-page-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 42px); font-weight: 600;
  color: var(--dark); line-height: 1.1; margin-bottom: 8px;
}
.dto-page-desc { font-size: 14px; color: var(--muted); line-height: 1.6; max-width: 400px; }

/* ── MAIN LAYOUT ── */
.dto-layout {
  max-width: 1080px; width: 100%;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: stretch;
}

/* ── LEFT PANEL ── */
.dto-left {
  display: flex; flex-direction: column; gap: 14px;
}

.dto-upload-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.dto-upload-card-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.dto-upload-card-icon {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--pink-light);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dto-upload-card-icon svg { width: 16px; height: 16px; color: var(--pink); }
.dto-upload-card-title { font-size: 14px; font-weight: 700; color: var(--dark); }
.dto-upload-card-sub   { font-size: 11px; color: var(--muted); margin-top: 1px; }

.dto-dropzone {
  border: 1.5px dashed #f0c0d0;
  border-radius: var(--radius-md);
  background: #fffafc;
  min-height: 180px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative; overflow: hidden;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.dto-dropzone:hover, .dto-dropzone.drag-over {
  border-color: var(--pink);
  background: #fff0f5;
  box-shadow: 0 0 0 4px rgba(240,98,146,.06);
}
.dto-dropzone.filled { border-style: solid; border-color: var(--pink-mid); min-height: 200px; }

.dto-dropzone-img {
  width: 100%; height: 100%; min-height: 200px;
  object-fit: cover; display: block; border-radius: 12px;
}

.dto-dropzone-overlay {
  position: absolute; inset: 0;
  background: rgba(26,16,32,.50);
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px; opacity: 0; transition: opacity .2s;
}
.dto-dropzone:hover .dto-dropzone-overlay { opacity: 1; }
.dto-overlay-pill {
  background: var(--pink); color: #fff;
  font-size: 12px; font-weight: 700; letter-spacing: .4px;
  padding: 7px 18px; border-radius: 20px;
}

.dto-dropzone-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 24px;
}
.dto-placeholder-circle {
  width: 50px; height: 50px; border-radius: 50%;
  background: var(--pink-light);
  display: flex; align-items: center; justify-content: center;
}
.dto-placeholder-circle svg { width: 22px; height: 22px; color: var(--pink); }
.dto-placeholder-label { font-size: 13px; font-weight: 600; color: var(--text); }
.dto-placeholder-hint  { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.5; }

input[type="file"].dto-file-input { display: none; }

/* ── GENERATE BTN ── */
.dto-generate-btn {
  width: 100%; padding: 16px;
  background: linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #db2777 100%);
  border: none; border-radius: var(--radius-md); cursor: pointer;
  color: #fff; font-family: 'Nunito Sans', sans-serif;
  font-size: 13px; font-weight: 800; letter-spacing: 1.4px;
  text-transform: uppercase;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(236,72,153,.35);
  transition: transform .15s, box-shadow .15s, opacity .15s;
}
.dto-generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(236,72,153,.42);
}
.dto-generate-btn:active:not(:disabled) { transform: translateY(0); }
.dto-generate-btn:disabled { opacity: .5; cursor: not-allowed; }

.sparkle-icon { font-size: 16px; animation: spin-slow 3s linear infinite; }
@keyframes spin-slow { to { transform: rotate(360deg); } }

/* ── RIGHT PANEL ── */
.dto-right {
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--border);
  box-shadow: var(--shadow-md);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.dto-preview-topbar {
  padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.dto-status-badge {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: .8px;
  text-transform: uppercase; color: var(--muted);
}
.dto-status-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.dto-status-dot.idle    { background: #d0d0d0; }
.dto-status-dot.loading { background: #f59e0b; animation: blink .8s ease-in-out infinite; }
.dto-status-dot.ready   { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.2); animation: pulse-green 2s infinite; }
@keyframes blink      { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes pulse-green{ 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.2)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,.08)} }

.dto-topbar-actions { display: flex; align-items: center; gap: 8px; }

.dto-icon-btn {
  width: 36px; height: 36px;
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  background: var(--bg); cursor: pointer; color: var(--muted);
  display: flex; align-items: center; justify-content: center;
  transition: border-color .15s, background .15s, color .15s;
}
.dto-icon-btn:hover { border-color: var(--pink); color: var(--pink); background: var(--pink-light); }
.dto-icon-btn svg { width: 16px; height: 16px; }

.dto-dl-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--dark); color: #fff; border: none;
  border-radius: var(--radius-sm); padding: 8px 16px;
  font-family: 'Nunito Sans', sans-serif;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.dto-dl-btn:hover:not(:disabled)  { background: #2d1f3a; }
.dto-dl-btn:disabled { opacity: .45; cursor: not-allowed; }
.dto-dl-btn svg { width: 14px; height: 14px; }

/* ── PREVIEW STAGE ── */
.dto-stage {
  flex: 1; position: relative; min-height: 380px;
  background: linear-gradient(145deg, #e8e0ea 0%, #d0c8d8 100%);
  display: flex; align-items: center; justify-content: center;
}

.dto-stage-empty {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  color: var(--muted); padding: 40px;
}
.dto-stage-empty-icon { font-size: 56px; opacity: .25; }
.dto-stage-empty-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px; font-style: italic; color: #a090a0; font-weight: 400;
}
.dto-stage-empty-sub { font-size: 12px; color: #b0a0b0; }

/* Result display */
.dto-result-grid {
  width: 100%; height: 100%; display: grid;
  grid-template-columns: 1fr 1fr;
}
.dto-result-grid img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dto-result-caption {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 40px 24px 20px;
  background: linear-gradient(transparent, rgba(20,10,28,.80));
}
.dto-result-caption p {
  font-family: 'Playfair Display', serif;
  font-style: italic; font-size: 13.5px; color: #f5e0f0;
  line-height: 1.65; max-width: 500px;
}

/* Loading overlay */
.dto-loading-overlay {
  position: absolute; inset: 0;
  background: rgba(248,240,252,.7);
  backdrop-filter: blur(6px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 18px;
}
.dto-spinner-ring {
  width: 52px; height: 52px;
  border: 3px solid #f0c8dc;
  border-top-color: var(--rose);
  border-radius: 50%;
  animation: spin .85s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.dto-loading-label {
  font-family: 'Playfair Display', serif;
  font-style: italic; font-size: 16px; color: #a0506c;
  animation: fade-pulse 1.6s ease-in-out infinite;
}
@keyframes fade-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
.dto-loading-steps { display: flex; gap: 6px; }
.dto-loading-step {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--pink-light);
  animation: step-bounce .9s ease-in-out infinite;
}
.dto-loading-step:nth-child(2) { animation-delay: .2s; }
.dto-loading-step:nth-child(3) { animation-delay: .4s; }
@keyframes step-bounce { 0%,80%,100%{transform:scale(0.7); background:var(--pink-light)} 40%{transform:scale(1.2); background:var(--pink);} }

/* Variation selector pill */
.dto-variation-pill {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(255,255,255,.92);
  border-radius: 30px; padding: 6px 14px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,.15);
  backdrop-filter: blur(8px);
  white-space: nowrap;
}
.dto-var-dot {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid transparent; overflow: hidden; cursor: pointer;
  transition: border-color .15s, transform .15s; flex-shrink: 0;
  background: var(--pink-light);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--pink);
}
.dto-var-dot img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.dto-var-dot.active { border-color: var(--pink); transform: scale(1.12); }
.dto-var-dot:hover:not(.active) { border-color: var(--pink-mid); }
.dto-var-label { font-size: 12px; font-weight: 600; color: var(--text); }

/* ── VARIATION THUMBNAILS below stage ── */
.dto-thumb-bar {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.dto-thumb {
  width: 60px; height: 60px; border-radius: var(--radius-sm);
  border: 2px solid transparent; overflow: hidden; cursor: pointer;
  transition: border-color .15s, transform .15s;
  background: var(--bg);
  flex-shrink: 0;
  position: relative;
}
.dto-thumb.active { border-color: var(--pink); transform: scale(1.04); }
.dto-thumb:hover:not(.active) { border-color: var(--pink-mid); }
.dto-thumb img { width: 100%; height: 100%; object-fit: cover; }
.dto-thumb-badge {
  position: absolute; top: 3px; left: 3px;
  background: var(--pink); color: #fff;
  font-size: 8px; font-weight: 800; letter-spacing: .4px;
  padding: 2px 5px; border-radius: 4px;
}
.dto-thumb-add {
  width: 60px; height: 60px; border-radius: var(--radius-sm);
  border: 1.5px dashed #e0c8d0;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; color: #c0a8b8; font-size: 20px;
  opacity: .65; flex-shrink: 0;
}
.dto-thumb-add span { font-size: 9px; font-weight: 600; letter-spacing: .4px; margin-top: 2px; text-transform: uppercase; }

/* Error */
.dto-error {
  background: #fff0f3; color: #c02040;
  font-size: 12px; border-radius: var(--radius-sm);
  padding: 10px 14px; text-align: center;
  border: 1px solid #f8c8d4;
}

@media (max-width: 680px) {
  .dto-layout { grid-template-columns: 1fr; }
  .dto-right { min-height: 420px; }
}
`;

/* ─────────────────────────────────────────────
   ICONS (inline SVG helpers)
───────────────────────────────────────────── */
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const HangerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 18H3.62a1 1 0 0 1-.7-1.7L12 8"/>
    <path d="M12 8V5"/>
    <circle cx="12" cy="4" r="1"/>
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const ZoomIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ─────────────────────────────────────────────
   UPLOAD CARD COMPONENT
───────────────────────────────────────────── */
function UploadCard({ title, subtitle, image, onFile, icon: Icon }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const pick = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="dto-upload-card">
      <div className="dto-upload-card-header">
        <div className="dto-upload-card-icon"><Icon /></div>
        <div>
          <div className="dto-upload-card-title">{title}</div>
          <div className="dto-upload-card-sub">{subtitle}</div>
        </div>
      </div>

      <input type="file" accept="image/*" className="dto-file-input" ref={ref}
        onChange={(e) => e.target.files[0] && pick(e.target.files[0])} />

      <div
        className={`dto-dropzone${image ? " filled" : ""}${drag ? " drag-over" : ""}`}
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      >
        {image ? (
          <>
            <img src={image} alt="uploaded" className="dto-dropzone-img" />
            <div className="dto-dropzone-overlay">
              <span className="dto-overlay-pill">Update Photo</span>
            </div>
          </>
        ) : (
          <div className="dto-dropzone-placeholder">
            <div className="dto-placeholder-circle"><UploadIcon /></div>
            <div className="dto-placeholder-label">
              {title === "Your Photo" ? "Upload your photo" : "Choose outfit"}
            </div>
            <div className="dto-placeholder-hint">Click or drag & drop<br />PNG, JPG supported</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DarpanTryOn() {
  const [userPhoto, setUserPhoto]   = useState(null);
  const [outfit, setOutfit]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [variations, setVariations] = useState([]);
  const [activeVar, setActiveVar]   = useState(0);

  const canGenerate = !!userPhoto && !!outfit && !loading;

  const currentVar = variations[activeVar] || null;
  const status = loading ? "loading" : currentVar ? "ready" : "idle";
  const statusLabel = loading ? "Generating…" : currentVar ? "AI Preview Ready" : "Awaiting Upload";

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);

    const toBase64 = (dataUrl) => dataUrl.split(",")[1];
    const mimeType = (dataUrl) => dataUrl.split(";")[0].split(":")[1];

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType(userPhoto), data: toBase64(userPhoto) } },
              { type: "image", source: { type: "base64", media_type: mimeType(outfit),    data: toBase64(outfit)    } },
              { type: "text", text: `You are a luxury fashion AI stylist. The first image is a person, the second is a garment.
Write a 2–3 sentence styling report describing how this outfit would look on this person:
cover the fit silhouette, color harmony, and the overall fashion impression.
Use elegant, editorial language. Be specific. No filler phrases. Start directly.` },
            ],
          }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "API error");

      const text = data.content?.map(c => c.text || "").join("") || "";
      const newVar = { id: Date.now(), userPhoto, outfit, caption: text };

      setVariations(prev => {
        const next = [...prev, newVar];
        setActiveVar(next.length - 1);
        return next;
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canGenerate, userPhoto, outfit]);

  const varLabels = ["A1", "B2", "V1", "V2", "V3"];

  return (
    <>
      <style>{CSS}</style>
      <div className="dto-wrap">
        <div style={{ maxWidth: 1080, width: "100%" }}>

          {/* Page header */}
          <div className="dto-page-header">
            <div className="dto-breadcrumb">Home › <span>Virtual Try-On</span></div>
            <h1 className="dto-page-title">AI Fashion Studio</h1>
            <p className="dto-page-desc">
              Transform your shopping experience. Upload your photo and any outfit
              to see the perfect fit powered by Darpan AI.
            </p>
          </div>

          {/* Main grid */}
          <div className="dto-layout">

            {/* ── LEFT ── */}
            <div className="dto-left">
              <UploadCard
                title="Your Photo"
                subtitle="Selfie or full-body shot"
                image={userPhoto}
                onFile={setUserPhoto}
                icon={PersonIcon}
              />

              <UploadCard
                title="Outfit Image"
                subtitle="Garment to try on"
                image={outfit}
                onFile={setOutfit}
                icon={HangerIcon}
              />

              {error && <div className="dto-error">⚠ {error}</div>}

              <button
                className="dto-generate-btn"
                onClick={generate}
                disabled={!canGenerate}
              >
                <span className="sparkle-icon">✦</span>
                {loading ? "Generating…" : "Generate Try-On"}
              </button>
            </div>

            {/* ── RIGHT ── */}
            <div className="dto-right">

              {/* Top bar */}
              <div className="dto-preview-topbar">
                <div className="dto-status-badge">
                  <div className={`dto-status-dot ${status}`} />
                  {statusLabel}
                </div>
                <div className="dto-topbar-actions">
                  <button className="dto-icon-btn" title="Zoom"><ZoomIcon /></button>
                  <button className="dto-icon-btn" title="Share"><ShareIcon /></button>
                  <button className="dto-dl-btn" disabled={!currentVar}>
                    <DownloadIcon /> Download Result
                  </button>
                </div>
              </div>

              {/* Stage */}
              <div className="dto-stage">
                {!currentVar && !loading && (
                  <div className="dto-stage-empty">
                    <div className="dto-stage-empty-icon">✦</div>
                    <div className="dto-stage-empty-title">Your look awaits</div>
                    <div className="dto-stage-empty-sub">Upload a photo & outfit, then hit Generate</div>
                  </div>
                )}

                {currentVar && !loading && (
                  <>
                    <div className="dto-result-grid">
                      <img src={currentVar.userPhoto} alt="You" />
                      <img src={currentVar.outfit} alt="Outfit" />
                    </div>
                    <div className="dto-result-caption">
                      <p>{currentVar.caption}</p>
                    </div>

                    {/* Variation pill overlay */}
                    {variations.length > 1 && (
                      <div className="dto-variation-pill">
                        {variations.map((v, i) => (
                          <div
                            key={v.id}
                            className={`dto-var-dot${activeVar === i ? " active" : ""}`}
                            onClick={() => setActiveVar(i)}
                            title={`Variation ${varLabels[i] || i + 1}`}
                          >
                            <img src={v.userPhoto} alt="" />
                          </div>
                        ))}
                        <span className="dto-var-label">
                          Variation {varLabels[activeVar] || activeVar + 1} Selected
                        </span>
                      </div>
                    )}
                  </>
                )}

                {loading && (
                  <div className="dto-loading-overlay">
                    <div className="dto-spinner-ring" />
                    <div className="dto-loading-label">Styling your look…</div>
                    <div className="dto-loading-steps">
                      <div className="dto-loading-step" />
                      <div className="dto-loading-step" />
                      <div className="dto-loading-step" />
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="dto-thumb-bar">
                {variations.map((v, i) => (
                  <div
                    key={v.id}
                    className={`dto-thumb${activeVar === i ? " active" : ""}`}
                    onClick={() => setActiveVar(i)}
                  >
                    <img src={v.userPhoto} alt="" />
                    {i === activeVar && (
                      <span className="dto-thumb-badge">CURRENT</span>
                    )}
                  </div>
                ))}
                {/* Fill remaining slots up to 3 */}
                {Array.from({ length: Math.max(0, 3 - variations.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="dto-thumb-add">
                    +<span>New</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
