import { Ico, SIDEBAR_CATS } from "@/components/wardrobe/shared";

const sidebarIcon = (cat) =>
  cat === "Tops" || cat === "Accessories" ? "shirt"
    : cat === "Bottoms" ? "scissors"
      : cat === "Outerwear" ? "shirt"
        : "grid";

export function Sidebar({ category, page, detail, filter, wishlist, setCategory, setDetail, setPage, setFilter, goPage }) {
  return (
    <aside className="dw-sidebar">
      <div className="dw-sidebar-logo" onClick={() => goPage("Wardrobe")}>Wardrobe</div>
      <div className="dw-sidebar-tagline">Archive Collective</div>

      <div className="dw-sidebar-section">Category</div>
      {SIDEBAR_CATS.map(cat => (
        <div
          key={cat}
          className={`dw-sidebar-item${category === cat && page === "Wardrobe" && !detail ? " active" : ""}`}
          onClick={() => { setCategory(cat); setDetail(null); setPage("Wardrobe"); }}
        >
          <Ico n={sidebarIcon(cat)} />
          {cat}
        </div>
      ))}

      <div className="dw-sidebar-divider" />

      <div
        className={`dw-sidebar-item${filter === "Saved" && page === "Wardrobe" ? " active" : ""}`}
        onClick={() => { setFilter("Saved"); setCategory("All"); goPage("Wardrobe"); }}
      >
        <Ico n="heart" /> Saved ({wishlist.length})
      </div>
    </aside>
  );
}
