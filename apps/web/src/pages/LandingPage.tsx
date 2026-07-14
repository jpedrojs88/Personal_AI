import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

const steps = [
  {
    title: "Responda algumas perguntas",
    description: "Informe seu objetivo, nível, disponibilidade e onde você pretende treinar.",
  },
  {
    title: "Receba seu treino com IA",
    description: "O Personal IA monta uma divisão semanal com exercícios, séries e descansos.",
  },
  {
    title: "Acompanhe sua evolução",
    description: "Registre cargas, peso corporal e check-ins para manter consistência.",
  },
] as const;

const features = [
  "Treinos personalizados com IA",
  "Registro de cargas utilizadas",
  "Histórico de peso e desempenho",
  "Chat para adaptar treinos",
  "Versões rápidas para dias corridos",
  "Guias visuais dos exercícios",
] as const;

const freeItems = [
  "1 plano de treino ativo",
  "Mensagens mensais limitadas com IA",
  "Histórico básico",
] as const;

const premiumItems = [
  "Treinos ilimitados",
  "Chat com IA ampliado",
  "Histórico completo",
  "Adaptações ilimitadas",
] as const;

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primaryPath = isAuthenticated ? "/app" : "/register";
  const primaryLabel = isAuthenticated ? "Abrir meu painel" : "Começar grátis";

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__media" aria-hidden="true">
          <div className="landing-phone">
            <div className="landing-phone__top">
              <span>Personal IA</span>
              <strong>72 min</strong>
            </div>
            <div className="landing-workout-card">
              <span>Hoje</span>
              <strong>Peito, Ombros e Triceps</strong>
              <small>4 exercicios esperando registro</small>
            </div>
            <div className="landing-progress-card">
              <span>Consistencia</span>
              <div className="landing-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero__content">
          <p className="eyebrow">Personal IA</p>
          <h1>Seu personal trainer com IA no bolso</h1>
          <p>
            Crie treinos personalizados em segundos, acompanhe sua evolução e mantenha
            consistência sem complicação.
          </p>
          <div className="landing-actions">
            <Link className="primary-button" to={primaryPath}>
              {primaryLabel}
            </Link>
            <Link className="ghost-button" to="/login">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__heading">
          <p className="eyebrow">Como funciona</p>
          <h2>Do questionário ao treino do dia em poucos passos</h2>
        </div>
        <div className="landing-grid landing-grid--three">
          {steps.map((step, index) => (
            <article className="landing-card" key={step.title}>
              <span className="landing-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__heading">
          <p className="eyebrow">Recursos</p>
          <h2>Feito para quem quer treinar melhor sem virar refém de planilha</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <div className="landing-feature" key={feature}>
              <span aria-hidden="true">+</span>
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--pricing">
        <div className="landing-section__heading">
          <p className="eyebrow">Planos</p>
          <h2>Comece grátis e evolua quando fizer sentido</h2>
        </div>
        <div className="landing-pricing">
          <article className="landing-price-card">
            <div>
              <h3>Grátis</h3>
              <p>Para começar com o essencial.</p>
            </div>
            <strong>R$ 0</strong>
            <ul>
              {freeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="landing-price-card landing-price-card--premium">
            <div>
              <h3>Premium</h3>
              <p>Para ampliar o uso da IA e acompanhar tudo com mais profundidade.</p>
            </div>
            <strong>R$ 9,90/mês</strong>
            <ul>
              {premiumItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">Pronto para treinar?</p>
        <h2>Comece sua evolução hoje</h2>
        <Link className="primary-button" to={primaryPath}>
          {primaryLabel}
        </Link>
      </section>

      <footer className="landing-footer">
        <p>
          O Personal IA oferece orientações educacionais sobre treino e não substitui avaliação
          médica ou acompanhamento profissional presencial.
        </p>
        <nav aria-label="Links legais">
          <Link to="/privacidade">Política de Privacidade</Link>
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/contato">Contato</Link>
        </nav>
      </footer>
    </main>
  );
}
