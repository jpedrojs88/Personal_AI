import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../lib/auth";
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

export function PlansPage() {
  const { token } = useAuth();
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

  const billing = billingQuery.data;
  const offers = billing?.premiumOffers ?? [];
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
          <span>{isPremium ? "Recursos Premium liberados" : "Modo Free ativo"}</span>
          <span>{billing?.payment.provider ?? "MOCK"}</span>
        </div>
      </div>

      <div className="grid-cards grid-cards--triple">
        <article className="card stat-card stat-card--accent">
          <span>Plano atual</span>
          <strong>{isPremium ? "Premium" : "Free"}</strong>
          <small>Status: {billing?.status ?? "ACTIVE"}</small>
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
          <h3>Seu plano Free esgotou as mensagens com IA deste mes</h3>
          <p>
            Ative o Premium de teste para continuar usando o coach ou aguarde o proximo ciclo
            mensal.
          </p>
        </article>
      ) : null}

      <div className="pricing-grid">
        <article
          className={isPremium ? "card pricing-card" : "card pricing-card pricing-card--muted"}
        >
          <div className="pricing-card__header">
            <div>
              <p className="eyebrow">Free</p>
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
          <button
            className="ghost-button"
            disabled={resetFreeMutation.isPending || !isPremium}
            onClick={() => resetFreeMutation.mutate()}
            type="button"
          >
            {resetFreeMutation.isPending ? "Voltando..." : "Usar plano Free"}
          </button>
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
              Descontos aplicados: 3 meses com 5%, 6 meses com 10% e 12 meses com 15%.
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
              disabled={checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
              type="button"
            >
              {checkoutMutation.isPending ? "Preparando..." : "Assinar Premium"}
            </button>
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
            {isPremium &&
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
          <h3>Fluxo preparado para integracao real</h3>
          <p>{checkoutMessage ?? customerPortalMutation.data?.message}</p>
        </article>
      ) : null}

      <article className="card stack">
        <div className="row-between">
          <h3>Status da assinatura</h3>
          <span className="pill">{billing?.payment.provider ?? "MOCK"}</span>
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
