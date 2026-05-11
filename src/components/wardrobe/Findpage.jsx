import { useState } from "react";

export default function FindPage({ products, onOpen }) {
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.tag.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  return (
    <div className="dw-find-wrap">
      <div>
        <div className="dw-section-eyebrow">Search the Archive</div>
        <h1 className="dw-section-title">Find Your Piece</h1>
      </div>
      <div className="dw-search-bar">
        <Ico n="search" />
        <input
          className="dw-search-input"
          placeholder="Search garments, categories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {query && <span style={{ fontSize:16, cursor:"pointer", color:"var(--muted)" }} onClick={() => setQuery("")}>×</span>}
      </div>
      {query
        ? results.length === 0
          ? <div style={{ color:"var(--muted)", fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:18 }}>No results for "{query}"</div>
          : <div className="dw-grid">
              {results.map(p => (
                <div key={p.id} className="dw-card" onClick={() => onOpen(p)}>
                  <div className="dw-card-img-wrap">
                    <div className="dw-card-img-placeholder" style={{ background:p.color, fontSize:52, opacity:.5 }}>{p.emoji}</div>
                    <div className="dw-card-tag">{p.tag}</div>
                  </div>
                  <div className="dw-card-info">
                    <div className="dw-card-meta">{p.tag} · {p.price}</div>
                    <div className="dw-card-name">{p.name}</div>
                  </div>
                </div>
              ))}
            </div>
        : <div className="dw-tag-chips">
            {CHIPS.map(c => (
              <button key={c} className="dw-filter-btn" onClick={() => setQuery(c)}>{c}</button>
            ))}
          </div>
      }
    </div>
  );
}
