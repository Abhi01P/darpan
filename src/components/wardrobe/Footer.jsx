export default function Footer() {
  return (
    <footer className="dw-footer">
      <div className="dw-footer-left">
        © 2024 Darpan · Archive Collective
      </div>

      <div className="dw-footer-links">
        {["Privacy Policy","Terms of Service","Contact"].map((l) => (
          <div key={l} className="dw-footer-link">
            {l}
          </div>
        ))}
      </div>
    </footer>
  );
}
