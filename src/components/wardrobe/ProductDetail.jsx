function ProductDetail({ product, wishlist, onWishlist, onAddBag, onBack }) {
  const [size, setSize] = useState(null);
  const liked = wishlist.some(w => w.id === product.id);
  return (
    <div>
      <button className="dw-btn-back" onClick={onBack}>
        <Ico n="back" /> Back to collection
      </button>
      <div className="dw-detail">
        <div className="dw-detail-img" style={{ background: product.color, opacity:.7 }}>
          <span style={{ fontSize:96, opacity:.55 }}>{product.emoji}</span>
        </div>
        <div className="dw-detail-right">
          <div>
            <div className="dw-detail-tag">{product.tag}</div>
            <div className="dw-detail-name">{product.name}</div>
            <div className="dw-detail-price">{product.price}</div>
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
          <div className="dw-detail-actions">
            <button className="dw-btn-primary" onClick={() => onAddBag(product)}>Add to Bag</button>
            <button className="dw-btn-secondary" onClick={() => onWishlist(product)}>
              {liked ? "♥ Saved" : "♡ Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
