import { LegalPageLayout } from "../components/LegalPageLayout";
import { siteConfig } from "../lib/site-config";

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Privacidade"
      title="Politica de privacidade"
      description="Explica quais dados o Personal IA coleta, como esses dados sao usados e quais canais voce pode usar para exercer seus direitos."
    >
      <div className="legal-content">
        <section>
          <h2>1. Escopo</h2>
          <p>
            Esta politica se aplica ao uso do aplicativo {siteConfig.brandName}, incluindo cadastro,
            onboarding, geracao de treinos, historico de evolucao, chat com IA e assinatura Premium.
          </p>
        </section>

        <section>
          <h2>2. Dados que coletamos</h2>
          <ul>
            <li>Dados de conta, como nome, e-mail e senha criptografada.</li>
            <li>Dados de perfil, como idade, sexo, altura, peso, objetivo e experiencia.</li>
            <li>Dados de treino, como exercicios concluidos, cargas, repeticoes e peso corporal.</li>
            <li>Mensagens trocadas com o Coach IA para adaptar treinos e responder duvidas.</li>
            <li>Dados de assinatura e status de pagamento processados pelo Stripe quando aplicavel.</li>
          </ul>
        </section>

        <section>
          <h2>3. Como usamos os dados</h2>
          <ul>
            <li>Personalizar treinos e acompanhar sua evolucao no aplicativo.</li>
            <li>Autenticar sua conta e proteger o acesso ao ambiente do usuario.</li>
            <li>Processar assinaturas, liberar recursos Premium e administrar cancelamentos.</li>
            <li>Responder solicitacoes de suporte, seguranca e obrigacoes legais.</li>
          </ul>
        </section>

        <section>
          <h2>4. Compartilhamento e operadores</h2>
          <p>
            O {siteConfig.brandName} utiliza provedores de infraestrutura e pagamento para operar o
            servico, como Supabase, Render, Vercel, Gemini API e Stripe. Esses provedores tratam
            dados apenas na medida necessaria para hospedar, autenticar, gerar respostas de IA e
            processar cobrancas.
          </p>
        </section>

        <section>
          <h2>5. Pagamentos e assinatura</h2>
          <p>
            Os dados completos do cartao nao sao armazenados pelo aplicativo. Quando a assinatura
            Premium e contratada, o processamento financeiro ocorre no ambiente seguro do Stripe.
          </p>
        </section>

        <section>
          <h2>6. Cookies, armazenamento local e sessao</h2>
          <p>
            O aplicativo utiliza armazenamento local do navegador para manter sua sessao, lembrar o
            token de acesso e melhorar a continuidade do uso entre visitas.
          </p>
        </section>

        <section>
          <h2>7. Seus direitos</h2>
          <p>
            Voce pode solicitar atualizacao, correcao ou exclusao de dados pessoais, observadas as
            obrigacoes legais e de seguranca aplicaveis ao servico.
          </p>
        </section>

        <section>
          <h2>8. Seguranca</h2>
          <p>
            Adotamos medidas tecnicas razoaveis para proteger os dados do usuario, incluindo senha
            com hash, autenticacao por token e controle de acesso nas rotas protegidas.
          </p>
        </section>

        <section>
          <h2>9. Contato sobre privacidade</h2>
          <p>
            Para duvidas, solicitacoes ou exercicio de direitos relacionados a dados pessoais, entre
            em contato pelo e-mail <a href={`mailto:${siteConfig.legalEmail}`}>{siteConfig.legalEmail}</a>.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
