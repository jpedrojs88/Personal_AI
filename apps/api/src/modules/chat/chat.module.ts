import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { BillingModule } from "../billing/billing.module";
import { ProfileModule } from "../profile/profile.module";
import { WorkoutsModule } from "../workouts/workouts.module";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  imports: [AiModule, BillingModule, ProfileModule, WorkoutsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
