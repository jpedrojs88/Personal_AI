import { LegalPageLayout } from "../components/LegalPageLayout";
import { siteConfig } from "../lib/site-config";

export function TermsOfUsePage() {
  return (
    <LegalPageLayout
      eyebrow="Termos"
      title="Termos de uso"
      description="Define as regras de uso do Personal IA, incluindo acesso ao servico, limites do assistente, assinatura Premium e politica comercial."
    >
      <div className="legal-content">
        <section>
          <h2>1. Natureza do servico</h2>
          <p>
            O {siteConfig.brandName} funciona como assistente educacional para planejamento de
            treinos e acompanhamento de rotina. O aplicativo nao realiza diagnostico medico, nao
            substitui profissionais de saude e nao promete resultados fisicos especificos.
          </p>
        </section>

        <section>
          <h2>2. Cadastro e responsabilidade da conta</h2>
          <p>
            O usuario deve fornecer informacoes verdadeiras e manter a confidencialidade do login.
            O compartilhamento indevido de acesso e de responsabilidade do titular da conta.
          </p>
        </section>

        <section>
          <h2>3. Uso adequado</h2>
          <ul>
            <li>Nao usar o aplicativo para fins ilicitos ou para tentar explorar falhas de seguranca.</li>
            <li>Nao publicar conteudos ofensivos, fraudulentos ou que violem direitos de terceiros.</li>
            <li>Consultar atendimento profissional presencial em caso de dor, lesao ou restricao medica.</li>
          </ul>
        </section>

        <section>
          <h2>4. Entrega do servico digital</h2>
          <p>
            O acesso ao plano escolhido e liberado digitalmente apos a confirmacao do cadastro ou do
            pagamento aprovado. Recursos Premium incluem liberacao de funcionalidades adicionais
            enquanto a assinatura permanecer ativa.
          </p>
        </section>

        <section>
          <h2>5. Assinaturas, renovacao e cancelamento</h2>
          <p>
            Assinaturas Premium podem ser cobradas de forma recorrente conforme o ciclo selecionado
            pelo usuario. O cancelamento pode ser feito pelo portal do cliente Stripe quando esta
            opcao estiver disponivel ou por solicitacao direta ao suporte.
          </p>
          <p>
            O cancelamento impede novas renovacoes, mas o acesso aos recursos pagos pode permanecer
            ativo ate o fim do periodo ja quitado, salvo obrigacao legal em contrario.
          </p>
        </section>

        <section>
          <h2>6. Reembolsos</h2>
          <p>
            Pedidos de reembolso sao analisados caso a caso, considerando o tempo decorrido, o uso
            efetivo do servico e a legislacao aplicavel. Quando houver direito legal de arrependimento
            ou cobranca indevida comprovada, o suporte orientara o procedimento adequado.
          </p>
        </section>

        <section>
          <h2>7. Suporte e contato</h2>
          <p>
            O atendimento ao usuario pode ser realizado pelos canais publicados na pagina de contato
            do site. O horario padrao de suporte e {siteConfig.supportHours}
          </p>
        </section>

        <section>
          <h2>8. Alteracoes destes termos</h2>
          <p>
            Estes termos podem ser atualizados para refletir melhorias no produto, exigencias
            operacionais, legais ou de pagamento. A versao mais recente permanecera publicada no site.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
