export const FREE_MONTHLY_MESSAGE_LIMIT = 15;
export const PREMIUM_MONTHLY_MESSAGE_LIMIT = 500;
export const PREMIUM_MONTHLY_PRICE_BRL = 9.9;
export const PREMIUM_MONTHLY_PRICE_LABEL = "R$ 9,90 / mes";

const premiumOfferDurations = [1, 3, 6, 12] as const;

const premiumOfferDiscounts: Record<(typeof premiumOfferDurations)[number], number> = {
  1: 0,
  3: 5,
  6: 10,
  12: 15,
};

type PremiumOfferDuration = (typeof premiumOfferDurations)[number];

type PremiumOffer = {
  billingCycleMonths: PremiumOfferDuration;
  label: string;
  discountPercent: number;
  baseTotalPriceBrl: number;
  totalPriceBrl: number;
  effectiveMonthlyPriceBrl: number;
  savingsBrl: number;
};

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function normalizeBillingCycleMonths(value?: number | null): PremiumOfferDuration {
  return premiumOfferDurations.includes(value as PremiumOfferDuration)
    ? (value as PremiumOfferDuration)
    : 1;
}

export function getPremiumOfferForMonths(value?: number | null): PremiumOffer {
  const billingCycleMonths = normalizeBillingCycleMonths(value);
  const discountPercent = premiumOfferDiscounts[billingCycleMonths];
  const baseTotalPriceBrl = roundCurrency(PREMIUM_MONTHLY_PRICE_BRL * billingCycleMonths);
  const totalPriceBrl = roundCurrency(baseTotalPriceBrl * ((100 - discountPercent) / 100));
  const effectiveMonthlyPriceBrl = roundCurrency(totalPriceBrl / billingCycleMonths);
  const savingsBrl = roundCurrency(baseTotalPriceBrl - totalPriceBrl);

  return {
    billingCycleMonths,
    label: billingCycleMonths === 1 ? "1 mes" : `${billingCycleMonths} meses`,
    discountPercent,
    baseTotalPriceBrl,
    totalPriceBrl,
    effectiveMonthlyPriceBrl,
    savingsBrl,
  };
}

export function getPremiumBillingOffers() {
  return premiumOfferDurations.map((months) => {
    const offer = getPremiumOfferForMonths(months);

    return {
      ...offer,
      totalPriceLabel: brlFormatter.format(offer.totalPriceBrl),
      baseTotalPriceLabel: brlFormatter.format(offer.baseTotalPriceBrl),
      effectiveMonthlyPriceLabel: `${brlFormatter.format(offer.effectiveMonthlyPriceBrl)} / mes`,
      savingsLabel: brlFormatter.format(offer.savingsBrl),
    };
  });
}
