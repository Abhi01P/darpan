<aside className="dw-sidebar">
            <div className="dw-sidebar-logo" onClick={() => goPage("Wardrobe")}>DARPAN</div>
            <div className="dw-sidebar-tagline">Archive Collective</div>

            <div className="dw-sidebar-section">Category</div>
            {SIDEBAR_CATS.map(cat => (
              <div
                key={cat}
                className={`dw-sidebar-item${category===cat && page==="Wardrobe" && !detail ? " active" : ""}`}
                onClick={() => { setCategory(cat); setDetail(null); setPage("Wardrobe"); }}
              >
                <Ico n={sidebarIcon(cat)} />
                {cat}
              </div>
            ))}

            <div className="dw-sidebar-divider" />
            <div className="dw-sidebar-section">Discover</div>

            <div className={`dw-sidebar-item${page==="Try-On"?" active":""}`} onClick={() => goPage("Try-On")}>
              <Ico n="star" /> Try-On
            </div>
            <div className={`dw-sidebar-item${page==="Find"?" active":""}`} onClick={() => goPage("Find")}>
              <Ico n="search" /> Find
            </div>
            <div
              className={`dw-sidebar-item${filter==="Saved" && page==="Wardrobe" ? " active" : ""}`}
              onClick={() => { setFilter("Saved"); setCategory("All"); goPage("Wardrobe"); }}
            >
              <Ico n="heart" /> Saved ({wishlist.length})
            </div>
          </aside>
