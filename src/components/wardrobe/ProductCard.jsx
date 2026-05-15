import { Ico } from "@/app/wardrobe/page";

export function ProductCard({ product, wishlist, onWishlist, onOpen }) {
  const liked = wishlist.some(w => w.id === product.id);
  return (
    <div className="dw-card" onClick={() => onOpen(product)}>
      <div className="dw-card-img-wrap">
        <div className="dw-card-img-placeholder"
          style={{ background: product.color, fontSize:52, opacity:.55 }}>
          {product.emoji}
        </div>
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
