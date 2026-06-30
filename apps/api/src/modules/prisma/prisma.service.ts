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
      throw new Error("A variavel DATABASE_URL nao foi configurada.");
    }

    if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
      throw new Error(
        "A DATABASE_URL deve comecar com postgresql:// ou postgres://. No Render, cole a URL bruta do Supabase sem colchetes nem placeholders."
      );
    }

    if (/[<>\[\]]/.test(databaseUrl) || /YOUR-|PROJECT-REF|PASSWORD|DB-REGION/i.test(databaseUrl)) {
      throw new Error(
        "A DATABASE_URL ainda contem placeholders. Substitua todo o valor pela string real de conexao do Supabase."
      );
    }
  }
}
