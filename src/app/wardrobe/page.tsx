/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Navbar from "@/components/wardrobe/Navbar";
import { Sidebar } from "@/components/wardrobe/Sidebar";
import { ProductCard } from "@/components/wardrobe/ProductCard";
import { ProductDetail } from "@/components/wardrobe/ProductDetail";

import FindPage from "@/components/wardrobe/Findpage";
import Footer from "@/components/wardrobe/Footer";

import { UploadModal } from "@/components/wardrobe/UploadModal";
import Image from "next/image";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:         #b8a8b0;
  --surface:    #c4b4bc;
  --nav-bg:     #2a1f28;
  --sidebar-bg: #1e1620;
  --card-bg:    #d8ccd4;
  --text:       #1a1018;
  --text-inv:   #e8dce0;
  --muted:      #6a5860;
  --pink-nav:   #e8a0b0;
  --border:     rgba(255,255,255,0.12);
  --radius:     4px;
}

.dw-root {
  font-family: 'Jost', sans-serif;
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}
/* TOP NAV */
.dw-topnav {
  background: var(--nav-bg);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 44px; flex-shrink: 0;
  position: sticky; top: 0; z-index: 200;
}
.dw-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 15px; font-weight: 600; letter-spacing: 3px;
  color: var(--text-inv); text-transform: uppercase; cursor: pointer; user-select: none;
}
.dw-nav-links { display: flex; align-items: center; }
.dw-nav-link {
  font-size: 10px; font-weight: 500; letter-spacing: 1.2px;
  text-transform: uppercase; color: rgba(232,220,224,0.55);
  padding: 0 14px; height: 44px; display: flex; align-items: center;
  cursor: pointer; transition: color .2s; border-bottom: 2px solid transparent; user-select: none;
}
.dw-nav-link:hover { color: var(--text-inv); }
.dw-nav-link.active { color: var(--pink-nav); border-bottom-color: var(--pink-nav); }
.dw-nav-icons { display: flex; align-items: center; gap: 14px; color: rgba(232,220,224,0.6); }
.dw-nav-icon {
  cursor: pointer; transition: color .2s; display: flex; align-items: center; position: relative;
}
.dw-nav-icon:hover { color: var(--text-inv); }
.dw-nav-icon svg { width: 16px; height: 16px; }
.dw-badge {
  position: absolute; top: -6px; right: -6px;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--pink-nav); color: var(--nav-bg);
  font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
/* BODY */
.dw-body { display: grid; grid-template-columns: 160px 1fr; flex: 1; min-height: 0; }

/* SIDEBAR */
.dw-sidebar {
  background: var(--sidebar-bg); padding: 20px 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--border);
  position: sticky; top: 44px; height: calc(100vh - 44px); overflow-y: auto;
}
.dw-sidebar-logo {
  font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 3px;
  text-transform: uppercase; color: var(--text-inv); padding: 0 18px 4px; cursor: pointer;
}
.dw-sidebar-tagline {
  font-size: 8px; letter-spacing: 1px; text-transform: uppercase;
  color: rgba(232,220,224,0.28); padding: 0 18px 18px;
}
.dw-sidebar-section {
  padding: 10px 18px 4px; font-size: 7.5px; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(232,220,224,0.28); font-weight: 600;
}
.dw-sidebar-item {
  display: flex; align-items: center; gap: 8px; padding: 7px 18px;
  font-size: 10.5px; letter-spacing: .8px; text-transform: uppercase;
  color: rgba(232,220,224,0.45); cursor: pointer; transition: color .15s, background .15s; user-select: none;
}
.dw-sidebar-item:hover { color: var(--text-inv); background: rgba(255,255,255,.04); }
.dw-sidebar-item.active {
  color: var(--text-inv); background: rgba(255,255,255,.06);
  border-left: 2px solid var(--pink-nav); padding-left: 16px;
}
.dw-sidebar-item svg { width: 11px; height: 11px; flex-shrink: 0; opacity: .7; }
.dw-sidebar-divider { height: 1px; background: var(--border); margin: 12px 18px; }

/* MAIN */
.dw-main { padding: 32px 36px; overflow-y: auto; }

/* CONTENT HEADER */
.dw-content-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; margin-bottom: 24px; gap: 20px;
}
.dw-section-eyebrow {
  font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--muted); margin-bottom: 10px;
}
.dw-section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px, 3.5vw, 36px); font-weight: 600;
  color: var(--text); line-height: 1.05; margin-bottom: 12px; letter-spacing: -0.5px;
}
.dw-section-desc { font-size: 12px; font-weight: 300; color: var(--muted); line-height: 1.7; max-width: 340px; }
.dw-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 8px; }
.dw-filter-btn {
  font-size: 9px; letter-spacing: 1px; text-transform: uppercase;
  color: var(--muted); background: transparent;
  border: 1px solid rgba(0,0,0,0.18); border-radius: var(--radius);
  padding: 5px 12px; cursor: pointer; font-family: 'Jost', sans-serif;
  transition: border-color .15s, color .15s, background .15s;
}
.dw-filter-btn:hover { border-color: var(--text); color: var(--text); }
.dw-filter-btn.active { background: var(--text); color: var(--text-inv); border-color: var(--text); }

/* GRID */
.dw-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
/* CARD */
.dw-card {
  background: var(--card-bg); border-radius: var(--radius);
  overflow: hidden; cursor: pointer; position: relative;
  transition: transform .22s, box-shadow .22s; animation: card-in .45s both;
}
.dw-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.22); }
@keyframes card-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.dw-card:nth-child(1){animation-delay:.04s} .dw-card:nth-child(2){animation-delay:.09s}
.dw-card:nth-child(3){animation-delay:.14s} .dw-card:nth-child(4){animation-delay:.18s}
.dw-card:nth-child(5){animation-delay:.23s} .dw-card:nth-child(6){animation-delay:.28s}
.dw-card-img-wrap {
  width: 100%; aspect-ratio: 3/4; overflow: hidden; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.dw-card-img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.dw-card-tag {
  position:absolute; top:10px; left:10px; font-size:7.5px;
  letter-spacing:1.2px; text-transform:uppercase; font-weight:600;
  background:rgba(26,16,24,.72); color:var(--text-inv); padding:3px 8px; border-radius:2px;
}
.dw-card-wishlist {
  position:absolute; top:10px; right:10px; width:28px; height:28px; border-radius:50%;
  background:rgba(255,255,255,.7); display:flex; align-items:center; justify-content:center;
  cursor:pointer; opacity:0; transition:opacity .2s, background .15s;
}
.dw-card:hover .dw-card-wishlist { opacity:1; }
.dw-card-wishlist:hover { background:rgba(255,255,255,.92); }
.dw-card-wishlist svg { width:13px; height:13px; color:#8a4060; }
.dw-card-wishlist.liked svg { fill:#e84070; color:#e84070; }
.dw-card-info { padding:10px 12px 12px; }
.dw-card-meta { font-size:7.5px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); margin-bottom:4px; }
.dw-card-name { font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:600; color:var(--text); line-height:1.3; }

/* DETAIL VIEW */
.dw-detail { display:grid; grid-template-columns:1fr 1fr; gap:40px; animation:card-in .35s both; }
.dw-detail-img {
  aspect-ratio:3/4; border-radius:8px; overflow:hidden;
  display:flex; align-items:center; justify-content:center; font-size:96px;
}
.dw-detail-right { padding-top:8px; display:flex; flex-direction:column; gap:16px; }
.dw-detail-tag { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); }
.dw-detail-name { font-family:'Cormorant Garamond',serif; font-size:34px; font-weight:600; color:var(--text); line-height:1.1; }
.dw-detail-price { font-size:20px; font-weight:500; color:var(--text); }
.dw-detail-desc { font-size:13px; font-weight:300; color:var(--muted); line-height:1.75; }
.dw-detail-divider { height:1px; background:rgba(0,0,0,.10); }
.dw-size-label { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
.dw-sizes { display:flex; gap:8px; flex-wrap:wrap; }
.dw-size-btn {
  width:38px; height:38px; border-radius:var(--radius);
  border:1px solid rgba(0,0,0,.18); background:transparent;
  font-family:'Jost',sans-serif; font-size:11px; font-weight:500;
  cursor:pointer; transition:all .15s; color:var(--text);
}
.dw-size-btn:hover,.dw-size-btn.active { background:var(--text); color:var(--text-inv); border-color:var(--text); }
.dw-detail-actions { display:flex; gap:10px; }
.dw-btn-primary {
  flex:1; padding:13px; background:var(--nav-bg); color:var(--text-inv);
  border:none; border-radius:var(--radius); font-family:'Jost',sans-serif;
  font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase;
  cursor:pointer; transition:background .15s;
}
.dw-btn-primary:hover { background:#3d2c3a; }
.dw-btn-secondary {
  padding:13px 16px; background:transparent; color:var(--text);
  border:1px solid rgba(0,0,0,.2); border-radius:var(--radius);
  font-family:'Jost',sans-serif; font-size:11px; font-weight:600;
  letter-spacing:1px; text-transform:uppercase; cursor:pointer; transition:all .15s;
}
.dw-btn-secondary:hover { background:rgba(0,0,0,.06); }
.dw-btn-back {
  display:inline-flex; align-items:center; gap:6px;
  font-size:10px; letter-spacing:1px; text-transform:uppercase;
  color:var(--muted); cursor:pointer; margin-bottom:20px;
  transition:color .15s; border:none; background:transparent;
  font-family:'Jost',sans-serif;
}
.dw-btn-back:hover { color:var(--text); }
.dw-btn-back svg { width:14px; height:14px; }

/* TRY-ON PAGE */
.dw-page-center { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; gap:18px; text-align:center; }
.dw-page-eyebrow { display:inline-block; background:var(--pink-nav); color:var(--nav-bg); font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:5px 14px; border-radius:20px; }
.dw-page-big { font-family:'Cormorant Garamond',serif; font-size:46px; font-weight:300; font-style:italic; color:var(--text); }
.dw-page-sub { font-size:12px; color:var(--muted); max-width:280px; line-height:1.7; }

/* FIND PAGE */
.dw-find-wrap { display:flex; flex-direction:column; gap:20px; }
.dw-search-bar {
  display:flex; align-items:center; gap:12px;
  background:rgba(255,255,255,.55); border-radius:var(--radius); padding:12px 16px;
}
.dw-search-bar svg { width:16px; height:16px; color:var(--muted); flex-shrink:0; }
.dw-search-input {
  flex:1; background:transparent; border:none; outline:none;
  font-family:'Jost',sans-serif; font-size:13px; color:var(--text);
}
.dw-search-input::placeholder { color:var(--muted); }
.dw-tag-chips { display:flex; gap:10px; flex-wrap:wrap; }

/* SIDE PANEL */
.dw-panel-overlay {
  position:fixed; inset:0; background:rgba(18,10,16,.45); z-index:300; animation:fade-in .2s;
}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
.dw-panel {
  position:fixed; top:0; right:0; bottom:0; width:320px;
  background:var(--sidebar-bg); z-index:400; display:flex; flex-direction:column;
  box-shadow:-8px 0 40px rgba(0,0,0,.35); animation:slide-in .25s cubic-bezier(.3,0,.2,1);
}
@keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
.dw-panel-header {
  padding:18px 20px 14px; border-bottom:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
}
.dw-panel-title { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:600; color:var(--text-inv); }
.dw-panel-close {
  width:30px; height:30px; border-radius:50%;
  background:rgba(255,255,255,.08); border:none; color:var(--text-inv);
  display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px;
}
.dw-panel-close:hover { background:rgba(255,255,255,.15); }
.dw-panel-body { flex:1; overflow-y:auto; padding:14px 20px; display:flex; flex-direction:column; gap:10px; }
.dw-panel-empty { text-align:center; color:rgba(232,220,224,.28); font-family:'Cormorant Garamond',serif; font-style:italic; font-size:16px; margin-top:40px; }
.dw-panel-item {
  display:flex; gap:12px; align-items:center;
  background:rgba(255,255,255,.05); border-radius:var(--radius); padding:10px;
}
.dw-panel-item-img {
  width:48px; height:58px; border-radius:3px; overflow:hidden;
  display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;
}
.dw-panel-item-info { flex:1; }
.dw-panel-item-name { font-family:'Cormorant Garamond',serif; font-size:13px; color:var(--text-inv); font-weight:600; }
.dw-panel-item-sub { font-size:8.5px; letter-spacing:.8px; text-transform:uppercase; color:rgba(232,220,224,.35); margin-top:2px; }
.dw-panel-item-remove { font-size:14px; color:rgba(232,220,224,.3); cursor:pointer; padding:4px; transition:color .15s; }
.dw-panel-item-remove:hover { color:#e84070; }
.dw-panel-footer { padding:14px 20px; border-top:1px solid var(--border); }
.dw-panel-total { display:flex; justify-content:space-between; font-size:11px; color:rgba(232,220,224,.45); margin-bottom:12px; }
.dw-panel-cta {
  width:100%; padding:12px; background:linear-gradient(135deg,#e8a0b0,#c86080);
  border:none; border-radius:var(--radius); color:#fff;
  font-family:'Jost',sans-serif; font-size:11px; font-weight:700;
  letter-spacing:1.2px; text-transform:uppercase; cursor:pointer; transition:opacity .15s;
}
.dw-panel-cta:hover { opacity:.88; }

/* TOAST */
.dw-toast {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:var(--nav-bg); color:var(--text-inv);
  font-size:12px; font-weight:500; letter-spacing:.4px;
  padding:10px 22px; border-radius:20px;
  box-shadow:0 4px 24px rgba(0,0,0,.3); z-index:500; white-space:nowrap;
  animation:toast-pop .3s cubic-bezier(.3,0,.2,1);
}
@keyframes toast-pop{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* FOOTER */
.dw-footer {
  background:var(--sidebar-bg); border-top:1px solid var(--border);
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 24px; flex-shrink:0;
}
.dw-footer-left { font-size:9px; letter-spacing:.8px; text-transform:uppercase; color:rgba(232,220,224,0.28); }
.dw-footer-links { display:flex; gap:20px; }
.dw-footer-link { font-size:9px; letter-spacing:.8px; text-transform:uppercase; color:rgba(232,220,224,0.35); cursor:pointer; transition:color .15s; }
.dw-footer-link:hover { color:var(--text-inv); }

/* HAMBURGER BUTTON */
.dw-hamburger {
  display: none;
  flex-direction: column; gap: 4px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
.dw-hamburger span {
  display: block; width: 20px; height: 1.5px; background: var(--text-inv);
  transition: all .2s;
}
.dw-hamburger span:nth-child(3) { width: 14px; }

/* SIDE DRAWER */
.dw-drawer-overlay {
  position: fixed; inset: 0;
  background: rgba(18,10,16,.5); z-index: 9998;
  animation: fade-in .2s;
}
.dw-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 260px; max-width: 80vw;
  background: var(--sidebar-bg); z-index: 9999;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 40px rgba(0,0,0,.4);
  animation: slide-in .25s cubic-bezier(.3,0,.2,1);
  padding-bottom: 20px;
}
.dw-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 18px; height: 44px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.dw-drawer-close {
  background: none; border: none; color: var(--text-inv);
  font-size: 26px; font-weight: 300; cursor: pointer; padding: 4px 8px;
  transition: color .15s;
}
.dw-drawer-close:hover { color: var(--pink-nav); }
.dw-drawer-section {
  padding: 16px 18px 6px; font-size: 7.5px; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(232,220,224,0.28); font-weight: 600;
}
.dw-drawer-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 18px; font-size: 13px; letter-spacing: .6px;
  color: rgba(232,220,224,0.55); cursor: pointer;
  transition: color .15s, background .15s;
  text-decoration: none; user-select: none;
}
.dw-drawer-item:hover { color: var(--text-inv); background: rgba(255,255,255,.04); }
.dw-drawer-item.active {
  color: var(--pink-nav);
  border-left: 2px solid var(--pink-nav); padding-left: 16px;
}
.dw-drawer-divider { height: 1px; background: var(--border); margin: 8px 18px; }

/* VISIBILITY UTILITIES */
.dw-desktop-only { display: flex; }
.dw-mobile-only { display: none; }

/* ─── RESPONSIVE ─────────────────────────────────────────── */
@media(max-width:880px){
  .dw-nav-links .dw-nav-link { padding: 0 10px; font-size: 9px; }
}
@media(max-width:680px){
  .dw-body{grid-template-columns:1fr}
  .dw-sidebar{display:none}
  .dw-grid{grid-template-columns:repeat(2,1fr)}
  .dw-detail{grid-template-columns:1fr}
  .dw-main { padding: 20px 16px; }
  .dw-content-header { flex-direction: column; }
  .dw-header-right { flex-wrap: wrap; }
  .dw-desktop-only { display: none !important; }
  .dw-mobile-only { display: flex !important; }
  .dw-hamburger { display: flex; }
}
@media(max-width:400px){
  .dw-grid{grid-template-columns:1fr}
}
`;

/* ─── PRODUCTS DATA ──────────────────────────────────────────── */
const PRODUCTS: any[] = [];

const FILTERS = ["All", "Curated", "New", "Saved"];

/* ─── SIDE PANEL ─────────────────────────────────────────────── */
function SidePanel({ title, items, onRemove, onClose, ctaLabel }: any) {
  const total = items.reduce((s: any, i: any) => s + parseInt(i.price.replace(/[^\d]/g, "")), 0);
  return (
    <>
      <div className="dw-panel-overlay" onClick={onClose} />
      <div className="dw-panel">
        <div className="dw-panel-header">
          <div className="dw-panel-title">{title} {items.length > 0 && `(${items.length})`}</div>
          <button className="dw-panel-close" onClick={onClose}>×</button>
        </div>
        <div className="dw-panel-body">
          {items.length === 0
            ? <div className="dw-panel-empty">Your {title.toLowerCase()} is empty</div>
            : items.map((item: any) => (
              <div key={item.id} className="dw-panel-item">
                <div className="dw-panel-item-img" style={{ background: item.color || "rgba(255,255,255,0.05)" }}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    item.emoji
                  )}
                </div>
                <div className="dw-panel-item-info">
                  <div className="dw-panel-item-name">{item.name}</div>
                  <div className="dw-panel-item-sub">{item.tag} · {item.price}</div>
                </div>
                <div className="dw-panel-item-remove" onClick={() => onRemove(item.id)}>✕</div>
              </div>
            ))
          }
        </div>
        {items.length > 0 && (
          <div className="dw-panel-footer">
            <div className="dw-panel-total">
              <span>Total</span>
              <span style={{ color: "var(--text-inv)", fontWeight: 600 }}>₹{total.toLocaleString("en-IN")}</span>
            </div>
            <button className="dw-panel-cta">{ctaLabel}</button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────── */
export default function Page() {
  const [products, setProducts] = useState<any[]>(PRODUCTS);
  const [page, setPage] = useState("Wardrobe");
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState("All");
  const [detail, setDetail] = useState(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [bag, setBag] = useState<any[]>([]);
  const [panel, setPanel] = useState<any>(null);  // "wishlist" | "bag" | null
  const [toast, setToast] = useState<any>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);

  const showToast = (msg: any) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const goPage = (pg: any) => { setPage(pg); setDetail(null); };

  const toggleWishlist = (product: any) => {
    setWishlist(prev => {
      const exists = prev.some(w => w.id === product.id);
      showToast(exists ? "Removed from wishlist" : `${product.name} saved ♥`);
      return exists ? prev.filter(w => w.id !== product.id) : [...prev, product];
    });
  };

  const addToBag = (product: any) => {
    setBag(prev => {
      if (prev.some(b => b.id === product.id)) { showToast("Already in bag"); return prev; }
      showToast(`${product.name} added to bag`);
      return [...prev, product];
    });
  };

  /* Filtered products for wardrobe grid */
  const visible = products.filter((p: any) => {
    const byCat = category === "All" || p.tag === category.toUpperCase();
    const byFilter =
      filter === "All" ||
      filter === "Curated" ||
      filter === "New" ||
      (filter === "Saved" && wishlist.some(w => w.id === p.id));
    return byCat && byFilter;
  });

  /* Sidebar icon map */
  

  return (
    <>
      <style>{CSS}</style>
      <div className="dw-root">

        {/* NAVBAR */}
        <Navbar
          page={page}
          goPage={goPage}
          bag={bag}
          wishlist={wishlist}
          setPanel={setPanel}
        />

        {/* BODY */}
        <div className="dw-body">

          {/* SIDEBAR */}
          <Sidebar
            category={category}
            setCategory={setCategory}
            page={page}
            goPage={goPage}
            setDetail={setDetail}
            setFilter={setFilter}
            wishlist={wishlist}
            detail={detail}
            filter={filter}
            setPage={setPage}
          />

          {/* MAIN CONTENT */}
          <main className="dw-main">

            {/* ── Wardrobe: Detail ── */}
            {page === "Wardrobe" && detail ? (
              <ProductDetail
                product={detail}
                wishlist={wishlist}
                onWishlist={toggleWishlist}
                onAddBag={addToBag}
                onBack={() => setDetail(null)}
              />

              /* ── Wardrobe: Grid ── */
            ) : page === "Wardrobe" ? (
              <>
                <div className="dw-content-header">
                  <div>
                    <div className="dw-section-eyebrow">A Study in Texture and Silhouette</div>
                    <h1 className="dw-section-title">The Curator&apos;s Selection</h1>
                    <p className="dw-section-desc">
                      Explore our modular archive designed for the modern atelier lifestyle,
                      where every piece is a foundational element.
                    </p>
                  </div>
                  <div className="dw-header-right">
                    <button
                      onClick={() => setUploadOpen(true)}
                      style={{
                        background: "linear-gradient(135deg, #e8a0b0 0%, #c86080 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 14px rgba(232, 64, 112, 0.35)",
                        transition: "all 0.2s ease",
                        fontFamily: "'Jost', sans-serif"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(232, 64, 112, 0.45)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(232, 64, 112, 0.35)"; }}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Upload Item
                    </button>
                    {FILTERS.map(f => (
                      <button
                        key={f}
                        className={`dw-filter-btn${filter === f ? " active" : ""}`}
                        onClick={() => setFilter(f)}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                {visible.length === 0
                  ? <div style={{ color: "var(--muted)", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 20, marginTop: 24 }}>
                    No pieces in this selection.
                  </div>
                  : <div className="dw-grid">
                    {visible.map(p => (
                      <ProductCard
                        key={p.id} product={p}
                        wishlist={wishlist}
                        onWishlist={toggleWishlist}
                        onOpen={(prod: any) => setDetail(prod)}
                      />
                    ))}
                  </div>
                }
              </>

              /* ── Find Page ── */
            ) : page === "Find" ? (
              <FindPage
                products={products}
                onOpen={(prod: any) => { setDetail(prod); setPage("Wardrobe"); }}
              />
            ) : null}

          </main>
        </div>

        {/* FOOTER */}
        <Footer />

        {/* SIDE PANELS */}
        {panel === "wishlist" && (
          <SidePanel
            title="Wishlist"
            items={wishlist}
            onRemove={(id: any) => setWishlist(prev => prev.filter(w => w.id !== id))}
            onClose={() => setPanel(null)}
            ctaLabel="Move All to Bag"
          />
        )}
        {panel === "bag" && (
          <SidePanel
            title="Your Bag"
            items={bag}
            onRemove={(id: any) => setBag(prev => prev.filter(b => b.id !== id))}
            onClose={() => setPanel(null)}
            ctaLabel="Proceed to Checkout"
          />
        )}

        {/* UPLOAD MODAL */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setUploadOpen(false)}
          onUpload={(newProduct: any) => {
            setProducts([newProduct, ...products]);
            showToast(`${newProduct.name} uploaded to archive`);
          }}
        />

        {/* TOAST */}
        {toast && <div className="dw-toast">{toast}</div>}

      </div>
    </>
  );
}



