import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthMiddleware } from "./modules/auth/auth.middleware";
import { BillingModule } from "./modules/billing/billing.module";
import { ChatModule } from "./modules/chat/chat.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { WorkoutsModule } from "./modules/workouts/workouts.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AiModule,
    AuthModule,
    ProfileModule,
    BillingModule,
    WorkoutsModule,
    ProgressModule,
    ChatModule,
    HealthModule,
  ],
  providers: [AuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/register", method: RequestMethod.POST },
      )
      .forRoutes("*");
  }
}
