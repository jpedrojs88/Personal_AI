import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  isMobileStoreBuild,
  isNativeMobileStoreAvailable,
  purchasePremiumMobile,
  restoreMobilePurchases,
} from "../lib/mobilePurchases";
import type { BillingStatus } from "../types";

type CheckoutSessionResponse = {
  provider: "MOCK" | "STRIPE" | "MERCADO_PAGO";
  checkoutReady: boolean;
  customerPortalReady: boolean;
  mockMode: boolean;
  checkoutUrl: string | null;
  message: string;
  billingCycleMonths: number;
  offer: BillingStatus["premiumOffers"][number];
};

type CustomerPortalResponse = {
  provider: "STRIPE";
  portalReady: boolean;
  url: string;
  message: string;
};

const featureRows = [
  {
    label: "Planos de treino",
    free: "1 plano ativo",
    premium: "Ilimitados",
  },
  {
    label: "Mensagens com IA",
    free: "Limite mensal",
    premium: "Cota ampliada",
  },
  {
    label: "Historico",
    free: "Basico",
    premium: "Completo",
  },
  {
    label: "Adaptacoes",
    free: "Limitadas",
    premium: "Ilimitadas",
  },
  {
    label: "Recursos futuros",
    free: "Nao inclusos",
    premium: "Liberados",
  },
] as const;

function getProviderLabel(billing?: BillingStatus | null) {
  if (!billing) {
    return "Carregando";
  }

  if (billing.payment.provider === "STRIPE") {
    return billing.payment.mode === "LIVE" ? "Stripe ao vivo" : "Stripe teste";
  }

  if (billing.payment.provider === "MERCADO_PAGO") {
    return "Mercado Pago";
  }

  if (billing.payment.provider === "APPLE_IAP") {
    return "Apple IAP";
  }

  if (billing.payment.provider === "GOOGLE_PLAY") {
    return "Google Play";
  }

  return "Simulacao";
}

function getStatusLabel(status?: BillingStatus["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Ativo";
    case "CANCELED":
      return "Cancelado";
    case "EXPIRED":
      return "Expirado";
    default:
      return "Ativo";
  }
}

export function PlansPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCycleMonths, setSelectedCycleMonths] = useState(12);

  const billingQuery = useQuery({
    queryKey: ["billing-status", token],
    queryFn: () => apiRequest<BillingStatus>("/billing/status", { token }),
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      apiRequest<CheckoutSessionResponse>("/billing/checkout-session", {
        method: "POST",
        token,
        body: JSON.stringify({ billingCycleMonths: selectedCycleMonths }),
      }),
    onSuccess: (response) => {
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl);
      }
    },
  });

  const activatePremiumMutation = useMutation({
    mutationFn: () =>
      apiRequest<BillingStatus>("/billing/mock/activate-premium", {
        method: "POST",
        token,
        body: JSON.stringify({ billingCycleMonths: selectedCycleMonths }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const resetFreeMutation = useMutation({
    mutationFn: () =>
      apiRequest<BillingStatus>("/billing/mock/reset-free", {
        method: "POST",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const customerPortalMutation = useMutation({
    mutationFn: () =>
      apiRequest<CustomerPortalResponse>("/billing/customer-portal", {
        method: "POST",
        token,
      }),
    onSuccess: (response) => {
      if (response.url) {
        window.location.assign(response.url);
      }
    },
  });

  const mobilePurchaseMutation = useMutation({
    mutationFn: () =>
      purchasePremiumMobile({
        token: token ?? "",
        userId: user?.id ?? "",
        billingCycleMonths: selectedCycleMonths,
        onVerified: () => {
          queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
          queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const restoreMobileMutation = useMutation({
    mutationFn: () =>
      restoreMobilePurchases({
        token: token ?? "",
        userId: user?.id ?? "",
        onVerified: () => {
          queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
          queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-status", token] });
      queryClient.invalidateQueries({ queryKey: ["progress-history", token] });
    },
  });

  const billing = billingQuery.data;
  const offers = useMemo(() => billing?.premiumOffers ?? [], [billing?.premiumOffers]);
  const selectedOffer = useMemo(
    () =>
      offers.find((offer) => offer.billingCycleMonths === selectedCycleMonths) ??
      offers[0] ??
      null,
    [offers, selectedCycleMonths],
  );
  const isPremium = billing?.effectivePlan === "PREMIUM";
  const isLimitReached = !isPremium && (billing?.monthlyMessagesRemaining ?? 0) <= 0;
  const checkoutMessage = checkoutMutation.data?.message;
  const hasRealCheckout = billing?.payment.provider === "STRIPE" && billing.payment.mode === "LIVE";
  const hasConfiguredStripe = billing?.payment.provider === "STRIPE" && billing.payment.checkoutReady;
  const mobileStoreBuild = isMobileStoreBuild();
  const nativeMobileStoreAvailable = isNativeMobileStoreAvailable();
  const showMockActions =
    !mobileStoreBuild && (billing?.payment.mockActionsEnabled ?? !hasConfiguredStripe);

  useEffect(() => {
    if (!offers.length) {
      return;
    }

    if (offers.some((offer) => offer.billingCycleMonths === selectedCycleMonths)) {
      return;
    }

    const recommendedOffer =
      offers.find((offer) => offer.billingCycleMonths === 12) ?? offers[0];
    setSelectedCycleMonths(recommendedOffer.billingCycleMonths);
  }, [offers, selectedCycleMonths]);

  return (
    <section className="page stack-lg">
      <div className="hero-card hero-card--plans">
        <p className="eyebrow">Planos</p>
        <h2>{isPremium ? "Premium ativo" : "Escolha como treinar com a IA"}</h2>
        <p>
          A assinatura serve para ampliar o uso do coach, liberar historico completo e preparar a
          cobranca recorrente no futuro sem mudar a estrutura do app.
        </p>
        <div className="hero-inline-stats">
          <span>{selectedOffer?.effectiveMonthlyPriceLabel ?? "R$ 9,90 / mes"}</span>
          <span>{isPremium ? "Recursos Premium liberados" : "Modo Gratuito ativo"}</span>
          <span>{getProviderLabel(billing)}</span>
        </div>
      </div>

      <div className="grid-cards grid-cards--triple">
        <article className="card stat-card stat-card--accent">
          <span>Plano atual</span>
          <strong>{isPremium ? "Premium" : "Gratuito"}</strong>
          <small>Status: {getStatusLabel(billing?.status)}</small>
        </article>
        <article className="card stat-card">
          <span>Mensagens com IA</span>
          <strong>
            {billing
              ? `${billing.monthlyMessagesRemaining}/${billing.monthlyMessageLimit}`
              : "--"}
          </strong>
          <small>Restantes no ciclo atual</small>
        </article>
        <article className="card stat-card">
          <span>Ciclo selecionado</span>
          <strong>{selectedOffer?.label ?? "12 meses"}</strong>
          <small>
            {selectedOffer?.discountPercent
              ? `${selectedOffer.discountPercent}% de desconto`
              : "Sem desconto"}
          </small>
        </article>
      </div>

      {isLimitReached ? (
        <article className="card stack card--warning">
          <p className="eyebrow">Limite atingido</p>
          <h3>Seu plano Gratuito esgotou as mensagens com IA deste mes</h3>
          <p>
            Ative o Premium para continuar usando o coach ou aguarde o proximo ciclo mensal.
          </p>
        </article>
      ) : null}

      {mobileStoreBuild ? (
        <article className="card stack card--warning">
          <p className="eyebrow">Versão mobile</p>
          <h3>
            {nativeMobileStoreAvailable
              ? "Assinatura nativa ativada"
              : "Assinaturas nativas preparadas"}
          </h3>
          <p>
            {nativeMobileStoreAvailable
              ? "Esta versão usa Apple IAP ou Google Play Billing para liberar o Premium dentro do app."
              : "No navegador, o checkout nativo nao aparece. Ao instalar o app pela loja, a compra usa Apple IAP ou Google Play Billing."}
          </p>
        </article>
      ) : null}

      <div className="pricing-grid">
        <article
          className={isPremium ? "card pricing-card" : "card pricing-card pricing-card--muted"}
        >
          <div className="pricing-card__header">
            <div>
              <p className="eyebrow">Gratuito</p>
              <h3>Essencial</h3>
            </div>
            <strong>R$ 0</strong>
          </div>
          <ul className="plain-list">
            {featureRows.map((item) => (
              <li key={item.label} className="list-row">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.free}</p>
                </div>
              </li>
            ))}
          </ul>
          {showMockActions ? (
            <button
              className="ghost-button"
              disabled={resetFreeMutation.isPending || !isPremium}
              onClick={() => resetFreeMutation.mutate()}
              type="button"
            >
              {resetFreeMutation.isPending ? "Voltando..." : "Usar plano Gratuito"}
            </button>
          ) : null}
        </article>

        <article className="card pricing-card pricing-card--premium">
          <div className="pricing-card__header">
            <div>
              <p className="eyebrow">Premium</p>
              <h3>Performance completa</h3>
            </div>
            <strong>
              {selectedOffer?.totalPriceLabel ?? billing?.premiumMonthlyPriceLabel ?? "R$ 9,90 / mes"}
            </strong>
          </div>

          <div className="offer-grid">
            {offers.map((offer) => (
              <button
                key={offer.billingCycleMonths}
                className={
                  selectedCycleMonths === offer.billingCycleMonths
                    ? "offer-card offer-card--active"
                    : "offer-card"
                }
                onClick={() => setSelectedCycleMonths(offer.billingCycleMonths)}
                type="button"
              >
                <div className="offer-card__top">
                  <strong>{offer.label}</strong>
                  {offer.discountPercent ? (
                    <span className="offer-badge">-{offer.discountPercent}%</span>
                  ) : (
                    <span className="offer-badge offer-badge--muted">Padrao</span>
                  )}
                </div>
                <span className="offer-price">{offer.totalPriceLabel}</span>
                <small>{offer.effectiveMonthlyPriceLabel}</small>
                <small>
                  {offer.discountPercent
                    ? `Economia de ${offer.savingsLabel}`
                    : "Cobranca mensal base"}
                </small>
              </button>
            ))}
          </div>

          <ul className="plain-list">
            {featureRows.map((item) => (
              <li key={item.label} className="list-row">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.premium}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="premium-inline-note">
            <p>
              Planos semestrais e anuais recebem desconto progressivo e ficam mais vantajosos no valor mensal.
            </p>
            <span className="pill">
              {selectedOffer?.discountPercent
                ? `${selectedOffer.discountPercent}% OFF`
                : "Sem desconto"}
            </span>
          </div>

          <div className="stack">
            <button
              className="primary-button"
              disabled={checkoutMutation.isPending || mobilePurchaseMutation.isPending}
              onClick={() => {
                if (mobileStoreBuild) {
                  mobilePurchaseMutation.mutate();
                  return;
                }

                checkoutMutation.mutate();
              }}
              type="button"
            >
              {mobileStoreBuild
                ? mobilePurchaseMutation.isPending
                  ? "Abrindo loja..."
                  : "Assinar pela loja"
                : checkoutMutation.isPending
                  ? "Preparando..."
                  : "Assinar Premium"}
            </button>
            {mobileStoreBuild ? (
              <button
                className="ghost-button"
                disabled={restoreMobileMutation.isPending}
                onClick={() => restoreMobileMutation.mutate()}
                type="button"
              >
                {restoreMobileMutation.isPending ? "Restaurando..." : "Restaurar compra"}
              </button>
            ) : null}
            {showMockActions ? (
              <button
                className="ghost-button"
                disabled={activatePremiumMutation.isPending}
                onClick={() => activatePremiumMutation.mutate()}
                type="button"
              >
                {activatePremiumMutation.isPending
                  ? "Ativando..."
                  : "Ativar Premium para teste"}
              </button>
            ) : null}
            {isPremium &&
            !mobileStoreBuild &&
            billing?.payment.provider === "STRIPE" &&
            billing.payment.customerPortalReady ? (
              <button
                className="ghost-button"
                disabled={customerPortalMutation.isPending}
                onClick={() => customerPortalMutation.mutate()}
                type="button"
              >
                {customerPortalMutation.isPending
                  ? "Abrindo portal..."
                  : "Gerenciar assinatura"}
              </button>
            ) : null}
          </div>
        </article>
      </div>

      {checkoutMessage || customerPortalMutation.data?.message ? (
        <article className="card stack">
          <p className="eyebrow">Pagamento</p>
          <h3>{hasRealCheckout ? "Cobranca real ativa no Stripe" : "Fluxo de pagamento pronto"}</h3>
          <p>{checkoutMessage ?? customerPortalMutation.data?.message}</p>
        </article>
      ) : null}

      {mobilePurchaseMutation.error || restoreMobileMutation.error ? (
        <article className="card stack card--warning">
          <p className="eyebrow">Loja mobile</p>
          <h3>Nao foi possivel concluir a compra</h3>
          <p>
            {(mobilePurchaseMutation.error ?? restoreMobileMutation.error) instanceof Error
              ? (mobilePurchaseMutation.error ?? restoreMobileMutation.error)?.message
              : "Tente novamente em instantes."}
          </p>
        </article>
      ) : null}

      {hasConfiguredStripe ? (
        <article className="card stack">
          <p className="eyebrow">Stripe</p>
          <h3>{hasRealCheckout ? "Conta ao vivo conectada" : "Conta de teste conectada"}</h3>
          <p>
            {hasRealCheckout
              ? "O checkout esta operando com a conta real do Stripe. Os botoes de teste ficam ocultos para evitar ativacoes simuladas em producao."
              : "O checkout esta configurado no Stripe, mas ainda usando credenciais de teste. Troque para as chaves e webhook live para iniciar a cobranca real."}
          </p>
        </article>
      ) : null}

      <article className="card stack">
        <div className="row-between">
          <h3>Status da assinatura</h3>
          <span className="pill">{getProviderLabel(billing)}</span>
        </div>
        <div className="profile-grid">
          <div className="profile-stat">
            <span>Ciclo atual</span>
            <strong>{billing?.currentBillingCycleLabel ?? "1 mes"}</strong>
          </div>
          <div className="profile-stat">
            <span>Inicio</span>
            <strong>
              {billing?.startedAt
                ? new Date(billing.startedAt).toLocaleDateString("pt-BR")
                : "--"}
            </strong>
          </div>
          <div className="profile-stat">
            <span>Expiracao</span>
            <strong>
              {billing?.expiresAt
                ? new Date(billing.expiresAt).toLocaleDateString("pt-BR")
                : "Sem data"}
            </strong>
          </div>
          <div className="profile-stat">
            <span>Historico completo</span>
            <strong>{billing?.features.fullHistory ? "Liberado" : "Bloqueado"}</strong>
          </div>
          <div className="profile-stat">
            <span>Adaptacoes ilimitadas</span>
            <strong>{billing?.features.unlimitedAdaptations ? "Liberado" : "Bloqueado"}</strong>
          </div>
          <div className="profile-stat">
            <span>Checkout real</span>
            <strong>{billing?.payment.checkoutReady ? "Pronto" : "Mock"}</strong>
          </div>
        </div>
        <Link className="ghost-link" to="/app/chat">
          Voltar para o Coach IA
        </Link>
      </article>
    </section>
  );
}
