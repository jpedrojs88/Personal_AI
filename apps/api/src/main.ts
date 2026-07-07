import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function parseConfiguredValues(rawValues: Array<string | undefined>) {
  return rawValues
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAllowedOrigins(rawValues: Array<string | undefined>) {
  const defaults = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const configured = parseConfiguredValues(rawValues);

  return [...new Set([...defaults.map((value) => normalizeOrigin(value)), ...configured])];
}

function parseAllowedOriginPatterns(
  rawValues: Array<string | undefined>,
  frontendUrl?: string,
) {
  const configuredPatterns = parseConfiguredValues(rawValues);
  const inferredPatterns: string[] = [];

  if (frontendUrl?.includes(".vercel.app")) {
    inferredPatterns.push("https://*.vercel.app");
  }

  return [...new Set([...configuredPatterns, ...inferredPatterns])].map((pattern) => {
    const normalizedPattern = normalizeOrigin(pattern);

    return new RegExp(
      `^${escapeRegex(normalizedPattern).replace(/\\\*/g, "[^/]+")}$`,
      "i",
    );
  });
}

function validateRuntimeConfiguration(configService: ConfigService) {
  const jwtSecret = configService.get<string>("JWT_SECRET")?.trim();

  if (!jwtSecret || jwtSecret === "change-me") {
    throw new Error(
      "JWT_SECRET precisa ser configurado com um valor forte antes de iniciar a API.",
    );
  }

  const paymentProvider = configService.get<string>("PAYMENT_PROVIDER")?.trim().toUpperCase();

  if (paymentProvider === "STRIPE") {
    const stripeSecretKey = configService.get<string>("STRIPE_SECRET_KEY")?.trim();

    if (!stripeSecretKey) {
      throw new Error(
        "STRIPE_SECRET_KEY precisa ser configurado quando PAYMENT_PROVIDER=stripe.",
      );
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  validateRuntimeConfiguration(configService);
  const frontendUrl = configService.get<string>("FRONTEND_URL");
  const allowedOrigins = parseAllowedOrigins([
    frontendUrl,
    configService.get<string>("CORS_ALLOWED_ORIGINS"),
  ]);
  const allowedOriginPatterns = parseAllowedOriginPatterns(
    [configService.get<string>("CORS_ALLOWED_ORIGIN_PATTERNS")],
    frontendUrl,
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const normalizedOrigin = origin ? normalizeOrigin(origin) : undefined;
      const isAllowedByPattern = normalizedOrigin
        ? allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
        : false;

      if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin) || isAllowedByPattern) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
}

void bootstrap();
