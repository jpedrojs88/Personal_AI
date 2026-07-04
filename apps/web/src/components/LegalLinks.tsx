import { Link } from "react-router-dom";

export function LegalLinks() {
  return (
    <nav aria-label="Links legais" className="legal-links">
      <Link to="/privacidade">Politica de privacidade</Link>
      <Link to="/termos">Termos de uso</Link>
      <Link to="/contato">Contato</Link>
    </nav>
  );
}
