import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    this.validateDatabaseUrl();
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }

  private validateDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not set.");
    }

    if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
      throw new Error(
        "DATABASE_URL must start with postgresql:// or postgres://. In Render, paste the raw Supabase URL without brackets or placeholder text."
      );
    }

    if (/[<>\[\]]/.test(databaseUrl) || /YOUR-|PROJECT-REF|PASSWORD|DB-REGION/i.test(databaseUrl)) {
      throw new Error(
        "DATABASE_URL still contains placeholder markers. Replace the entire value with the real Supabase connection string."
      );
    }
  }
}
