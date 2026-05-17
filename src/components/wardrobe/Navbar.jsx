"use client";

import { Ico } from "@/components/wardrobe/shared";

const NAV_PAGES = ["Wardrobe", "Try-On", "Find"];

export default function Navbar({ page, goPage, bag, wishlist, setPanel }) {
  return (
    <nav className="dw-topnav">
          <div className="dw-logo" onClick={() => goPage("Wardrobe")}>DARPAN</div>
          <div className="dw-nav-links">
            {NAV_PAGES.map(pg => (
              <div key={pg} className={`dw-nav-link${page===pg?" active":""}`} onClick={() => goPage(pg)}>{pg}</div>
            ))}
          </div>
          <div className="dw-nav-icons">
            <div className="dw-nav-icon" onClick={() => setPanel("bag")} title="Bag">
              <Ico n="bag" />
              {bag.length > 0 && <div className="dw-badge">{bag.length}</div>}
            </div>
            <div className="dw-nav-icon" onClick={() => setPanel("wishlist")} title="Wishlist">
              <Ico n="heart" />
              {wishlist.length > 0 && <div className="dw-badge">{wishlist.length}</div>}
            </div>
          </div>
        </nav>
  );
}
