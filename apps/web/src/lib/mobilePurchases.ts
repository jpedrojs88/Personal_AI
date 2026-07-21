import { Capacitor } from "@capacitor/core";
import { apiRequest } from "./api";
import type { BillingStatus } from "../types";

type PurchaseModule = typeof import("capacitor-plugin-cdv-purchase");
type PlatformValue =
  | PurchaseModule["Platform"]["APPLE_APPSTORE"]
  | PurchaseModule["Platform"]["GOOGLE_PLAY"];
type IError = import("capacitor-plugin-cdv-purchase").IError;

type MobileProduct = {
  billingCycleMonths: number;
  appleProductId: string;
  googleProductId: string;
};

type ValidatorBody = {
  id?: string;
  transaction?: {
    type?: "ios-appstore" | "apple-sk2" | "android-playstore";
    id?: string;
    appStoreReceipt?: string;
    jwsRepresentation?: string;
    purchaseToken?: string;
    receipt?: string;
  };
};

type MobilePurchaseVerifyResponse = BillingStatus;

const mobileProducts: MobileProduct[] = [
  {
    billingCycleMonths: 1,
    appleProductId:
      import.meta.env.VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_MONTHLY ?? "personalia.premium.monthly",
    googleProductId:
      import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_MONTHLY ?? "personalia.premium.monthly",
  },
  {
    billingCycleMonths: 3,
    appleProductId:
      import.meta.env.VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_3M ?? "personalia.premium.3m",
    googleProductId:
      import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_3M ?? "personalia.premium.3m",
  },
  {
    billingCycleMonths: 6,
    appleProductId:
      import.meta.env.VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_6M ?? "personalia.premium.6m",
    googleProductId:
      import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_6M ?? "personalia.premium.6m",
  },
  {
    billingCycleMonths: 12,
    appleProductId:
      import.meta.env.VITE_APPLE_IAP_PRODUCT_ID_PREMIUM_12M ?? "personalia.premium.12m",
    googleProductId:
      import.meta.env.VITE_GOOGLE_PLAY_PRODUCT_ID_PREMIUM_12M ?? "personalia.premium.12m",
  },
];

let initializedForToken: string | null = null;
let purchaseModulePromise: Promise<PurchaseModule> | null = null;

export function isMobileStoreBuild() {
  return import.meta.env.VITE_APP_STORE_BUILD === "true";
}

export function isNativeMobileStoreAvailable() {
  return isMobileStoreBuild() && Capacitor.isNativePlatform();
}

export function getMobileProductId(billingCycleMonths: number) {
  const product = mobileProducts.find((item) => item.billingCycleMonths === billingCycleMonths);
  const platform = Capacitor.getPlatform();

  if (!product) {
    return null;
  }

  return platform === "ios" ? product.appleProductId : product.googleProductId;
}

export async function initializeMobilePurchases(options: {
  token: string;
  userId: string;
  onVerified: (status: BillingStatus) => void;
}) {
  if (!isNativeMobileStoreAvailable() || initializedForToken === options.token) {
    return;
  }

  const purchaseModule = await getPurchaseModule();
  const { ErrorCode, LogLevel, ProductType, store } = purchaseModule;
  const platform = getPurchasePlatform(purchaseModule);
  const registeredProducts = mobileProducts.map((product) => ({
    id:
      platform === purchaseModule.Platform.APPLE_APPSTORE
        ? product.appleProductId
        : product.googleProductId,
    platform,
    type: ProductType.PAID_SUBSCRIPTION,
  }));

  store.verbosity = LogLevel.WARNING;
  store.applicationUsername = options.userId;
  store.validator_privacy_policy = ["fraud", "support"];
  store.validator = (body, callback) => {
    void validateReceipt(body as ValidatorBody, options.token)
      .then((status) => {
        options.onVerified(status);
        callback({
          ok: true,
          data: {
            id: extractProductId(body as ValidatorBody),
            latest_receipt: true,
            transaction: {
              type: "test",
            },
            collection: [
              {
                id: extractProductId(body as ValidatorBody),
                transactionId:
                  (body as ValidatorBody).transaction?.id ??
                  (body as ValidatorBody).transaction?.purchaseToken ??
                  "mobile-store-transaction",
                purchaseDate: Date.now(),
                expiryDate: status.expiresAt ? new Date(status.expiresAt).getTime() : undefined,
                isExpired: status.effectivePlan !== "PREMIUM",
              },
            ],
          },
        });
      })
      .catch((error: unknown) => {
        callback({
          ok: false,
          status: 400,
          code: ErrorCode.VERIFICATION_FAILED,
          message: error instanceof Error ? error.message : "Nao foi possivel validar a compra.",
        });
      });
  };

  store.register(registeredProducts);
  store.when()
    .approved((transaction) => {
      void transaction.verify();
    })
    .verified((receipt) => {
      void receipt.finish();
    });

  await store.initialize([{ platform }]);
  initializedForToken = options.token;
}

export async function purchasePremiumMobile(options: {
  token: string;
  userId: string;
  billingCycleMonths: number;
  onVerified: (status: BillingStatus) => void;
}) {
  if (!isNativeMobileStoreAvailable()) {
    throw new Error("Compras nativas so estao disponiveis no app instalado.");
  }

  await initializeMobilePurchases(options);

  const purchaseModule = await getPurchaseModule();
  const { store } = purchaseModule;
  const productId = getMobileProductId(options.billingCycleMonths);
  const product = productId ? store.get(productId, getPurchasePlatform(purchaseModule)) : undefined;
  const offer = product?.getOffer();

  if (!productId || !product || !offer) {
    throw new Error("Produto Premium nao encontrado na loja. Confira os IDs no App Store Connect/Play Console.");
  }

  const error = await offer.order();
  handleStoreError(error, purchaseModule);
}

export async function restoreMobilePurchases(options: {
  token: string;
  userId: string;
  onVerified: (status: BillingStatus) => void;
}) {
  if (!isNativeMobileStoreAvailable()) {
    throw new Error("Restauracao de compras so esta disponivel no app instalado.");
  }

  await initializeMobilePurchases(options);
  const { store } = await getPurchaseModule();
  await store.restorePurchases();
}

function getPurchaseModule() {
  purchaseModulePromise ??= import("capacitor-plugin-cdv-purchase");
  return purchaseModulePromise;
}

function getPurchasePlatform(purchaseModule: PurchaseModule): PlatformValue {
  return Capacitor.getPlatform() === "ios"
    ? purchaseModule.Platform.APPLE_APPSTORE
    : purchaseModule.Platform.GOOGLE_PLAY;
}

async function validateReceipt(body: ValidatorBody, token: string) {
  const transaction = body.transaction;
  const productId = extractProductId(body);

  return apiRequest<MobilePurchaseVerifyResponse>("/billing/mobile/verify", {
    method: "POST",
    token,
    body: JSON.stringify({
      platform:
        transaction?.type ??
        (Capacitor.getPlatform() === "ios" ? "apple-sk2" : "android-playstore"),
      productId,
      receipt: body,
      purchaseToken: transaction?.purchaseToken ?? readPurchaseToken(transaction?.receipt),
      transactionId: transaction?.id,
      signedTransactionInfo: transaction?.jwsRepresentation,
    }),
  });
}

function extractProductId(body: ValidatorBody) {
  const transaction = body.transaction;

  if (transaction?.type === "apple-sk2" && transaction.id) {
    return transaction.id;
  }

  const receiptProductId = readProductId(transaction?.receipt);

  return receiptProductId ?? body.id ?? transaction?.id ?? "";
}

function readPurchaseToken(receipt?: string) {
  return readGoogleReceipt(receipt)?.purchaseToken;
}

function readProductId(receipt?: string) {
  return readGoogleReceipt(receipt)?.productId;
}

function readGoogleReceipt(receipt?: string) {
  if (!receipt) {
    return null;
  }

  try {
    return JSON.parse(receipt) as { productId?: string; purchaseToken?: string };
  } catch {
    return null;
  }
}

function handleStoreError(error: IError | undefined, purchaseModule: PurchaseModule) {
  if (!error) {
    return;
  }

  if (error.code === purchaseModule.ErrorCode.PAYMENT_CANCELLED) {
    throw new Error("Compra cancelada.");
  }

  throw new Error(error.message || "A loja nao conseguiu iniciar a compra.");
}
