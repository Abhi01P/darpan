import { Ico } from "@/components/wardrobe/shared";

export function ProductCard({ product, wishlist, onWishlist, onOpen }) {
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
      </div>
      <div className="dw-card-info">
        <div className="dw-card-meta">{product.tag} · {product.price}</div>
        <div className="dw-card-name">{product.name}</div>
      </div>
    </div>
  );
}
