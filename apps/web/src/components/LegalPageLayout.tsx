import { Link } from "react-router-dom";
import { LegalLinks } from "./LegalLinks";
import { siteConfig } from "../lib/site-config";
import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  description,
  children,
}: LegalPageLayoutProps) {
  return (
    <section className="legal-page">
      <div className="legal-shell">
        <header className="legal-hero">
          <div className="stack">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="muted">{description}</p>
          </div>

          <div className="legal-hero__actions">
            <Link className="ghost-link" to="/login">
              Voltar para o acesso
            </Link>
            <LegalLinks />
          </div>
        </header>

        <article className="card legal-card">
          {children}
        </article>

        <footer className="legal-footer">
          <p>{siteConfig.brandName}</p>
          <p>Ultima atualizacao: 4 de julho de 2026</p>
        </footer>
      </div>
    </section>
  );
}
