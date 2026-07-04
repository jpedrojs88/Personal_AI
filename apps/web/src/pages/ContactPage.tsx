import { LegalPageLayout } from "../components/LegalPageLayout";
import { getContactLinks, siteConfig } from "../lib/site-config";

export function ContactPage() {
  const contactLinks = getContactLinks();

  return (
    <LegalPageLayout
      eyebrow="Contato"
      title="Formas de contato"
      description="Canais de atendimento e relacionamento para suporte, assinaturas, privacidade e duvidas gerais sobre o Personal IA."
    >
      <div className="legal-content">
        <section>
          <h2>1. Atendimento ao cliente</h2>
          <p>
            Para duvidas sobre acesso, assinatura, cancelamento, cobranca, suporte tecnico ou
            privacidade, use um dos canais diretos abaixo.
          </p>
        </section>

        <section>
          <h2>2. Canais disponiveis</h2>
          <div className="contact-grid">
            {contactLinks.map((item) => (
              <a
                key={item.label}
                className="contact-card"
                href={item.href}
                rel="noreferrer"
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2>3. Endereco e horario</h2>
          <div className="profile-grid">
            <div className="profile-stat">
              <span>Marca</span>
              <strong>{siteConfig.brandName}</strong>
            </div>
            <div className="profile-stat">
              <span>Horario de suporte</span>
              <strong>{siteConfig.supportHours}</strong>
            </div>
            <div className="profile-stat profile-stat--full">
              <span>Endereco comercial</span>
              <strong>{siteConfig.address}</strong>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Assinaturas e cobranca</h2>
          <p>
            Solicitacoes relacionadas a pagamento, renovacao, cancelamento ou reembolso podem ser
            enviadas pelo email <a href={`mailto:${siteConfig.legalEmail}`}>{siteConfig.legalEmail}</a>.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
