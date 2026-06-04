import { useState } from "react";
import { Ico } from "@/components/wardrobe/shared";

export function ProductDetail({ product, wishlist, onWishlist, onAddBag, onBack }) {
  const [size, setSize] = useState(null);
  const liked = wishlist.some(w => w.id === product.id);
  return (
    <div>
      <button className="dw-btn-back" onClick={onBack}>
        <Ico n="back" /> Back to collection
      </button>
      <div className="dw-detail">
        <div className="dw-detail-img" style={{ background: product.color || "rgba(255,255,255,0.05)", opacity: product.image_url ? 1 : 0.7 }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize:96, opacity:.55 }}>{product.emoji}</span>
          )}
        </div>
        <div className="dw-detail-right">
          <div>
            <div className="dw-detail-tag">{product.tag}</div>
            <div className="dw-detail-name">{product.name}</div>
            <div className="dw-detail-price" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{product.price}</span>
              {product.rating && (
                <span style={{ fontSize: '14px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⭐ {Number(product.rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <p className="dw-detail-desc">{product.desc}</p>
          <div className="dw-detail-divider" />
          <div>
            <div className="dw-size-label">Select Size</div>
            <div className="dw-sizes">
              {product.sizes.map(s => (
                <button key={s} className={`dw-size-btn${size===s?" active":""}`} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="dw-detail-actions" style={{ display: 'flex', gap: 12 }}>
            <button 
              className="dw-btn-primary" 
              onClick={() => {
                if (product.image_url) {
                  window.location.href = `/try-on?garmentImage=${encodeURIComponent(product.image_url)}`;
                }
              }}
              disabled={!product.image_url}
              style={{ flex: 1, opacity: product.image_url ? 1 : 0.5 }}
            >
              2D Try On
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
