import { Ico } from "@/components/wardrobe/shared";

export function ProductCard({ product, wishlist, onWishlist, onOpen, onDelete }) {
  const liked = wishlist.some(w => w.id === product.id);
  return (
    <div className="dw-card" onClick={() => onOpen(product)}>
      <div className="dw-card-img-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="dw-card-img-placeholder"
            style={{ background: product.color, fontSize:52, opacity:.55 }}>
            {product.emoji}
          </div>
        )}
        <div className="dw-card-tag">{product.tag}</div>
        <div className={`dw-card-wishlist${liked?" liked":""}`}
          onClick={e => { e.stopPropagation(); onWishlist(product); }}>
          <Ico n="heart" />
        </div>
        <div className="dw-card-delete dw-card-delete-btn"
          onClick={e => { 
            e.stopPropagation(); 
            if (window.confirm("Are you sure you want to delete this item?")) {
              if (onDelete) onDelete(product.id);
            }
          }}
          style={{
            position: 'absolute', bottom: '10px', right: '10px', width: '28px', height: '28px', 
            borderRadius: '50%', background: 'rgba(255,255,255,0.7)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, 
            transition: 'opacity .2s, background .15s', color: '#e84070', fontSize: '14px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.92)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
        >
          ✕
        </div>
      </div>
      <style>{`
        .dw-card:hover .dw-card-delete-btn { opacity: 1 !important; }
      `}</style>
      <div className="dw-card-info">
        <div className="dw-card-meta">
          {product.tag} · {product.price}
          {product.rating ? ` · ⭐ ${Number(product.rating).toFixed(1)}` : ""}
        </div>
        <div className="dw-card-name">{product.name}</div>
      </div>
    </div>
  );
}
