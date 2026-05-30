"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ico } from "@/components/wardrobe/shared";

const NAV_COMP = [
  { label: "Wardrobe", key: "Wardrobe", href: "/wardrobe" },
  { label: "Find", key: "Find", href: null },
];
const NAV_PAGE = [
  { label: "Try On", href: "/try-on" },
  { label: "AI Chat", href: "/ai-chat" },
];

/**
 * Shared Navbar. Works in two modes:
 * - Inside wardrobe page: pass goPage, bag, wishlist, setPanel
 * - Standalone (try-on, ai-chat): pass activePage only, nav uses router
 */
export default function Navbar({
  page = "",
  goPage = undefined,
  bag = undefined,
  wishlist = undefined,
  setPanel = undefined,
  activePage = "",
}) {
  const _bag = bag || [];
  const _wishlist = wishlist || [];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  // Determine which page label is "active" for highlighting
  const currentPage = activePage || page || "";

  const handleNav = (key, href) => {
    setDrawerOpen(false);
    if (goPage && !href) {
      goPage(key);
    } else {
      router.push(href || "/wardrobe");
    }
  };

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  return (
    <>
      <nav className="dw-topnav">
        <div className="dw-logo" onClick={handleLogoClick}>DARPAN</div>

        {/* Desktop links */}
        <div className="dw-nav-links dw-desktop-only">
          {NAV_COMP.map(({ label, key, href }) => {
            if (href) {
              return (
                <Link key={key} href={href}
                  className={`dw-nav-link${currentPage === key ? " active" : ""}`}
                  style={{ textDecoration: "none" }}
                >{label}</Link>
              );
            }
            return (
              <div key={key}
                className={`dw-nav-link${currentPage === key ? " active" : ""}`}
                onClick={() => handleNav(key, null)}
              >{label}</div>
            );
          })}
          {NAV_PAGE.map(({ label, href }) => (
            <Link key={href} href={href}
              className={`dw-nav-link${currentPage === label ? " active" : ""}`}
              style={{ textDecoration: "none" }}
            >{label}</Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Icons — only show when inside wardrobe (has setPanel) */}
          {setPanel && (
            <div className="dw-nav-icons">
              <div className="dw-nav-icon" onClick={() => setPanel("bag")} title="Bag">
                <Ico n="bag" />
                {_bag.length > 0 && <div className="dw-badge">{_bag.length}</div>}
              </div>
              <div className="dw-nav-icon" onClick={() => setPanel("wishlist")} title="Wishlist">
                <Ico n="heart" />
                {_wishlist.length > 0 && <div className="dw-badge">{_wishlist.length}</div>}
              </div>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button className="dw-hamburger dw-mobile-only" onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Side drawer */}
      {drawerOpen && (
        <>
          <div className="dw-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="dw-drawer">
            <div className="dw-drawer-header">
              <div className="dw-logo" style={{ fontSize: 14 }}>DARPAN</div>
              <button className="dw-drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            </div>

            <div className="dw-drawer-section">Navigate</div>
            {NAV_COMP.map(({ label, key, href }) => (
              <div
                key={key}
                className={`dw-drawer-item${currentPage === key ? " active" : ""}`}
                onClick={() => handleNav(key, href)}
              >
                {label}
              </div>
            ))}

            <div className="dw-drawer-divider" />
            <div className="dw-drawer-section">Discover</div>
            {NAV_PAGE.map(({ label, href }) => (
              <Link
                key={href} href={href}
                className={`dw-drawer-item${currentPage === label ? " active" : ""}`}
                style={{ textDecoration: "none" }}
                onClick={() => setDrawerOpen(false)}
              >
                {label}
              </Link>
            ))}
          </aside>
        </>
      )}
    </>
  );
}
