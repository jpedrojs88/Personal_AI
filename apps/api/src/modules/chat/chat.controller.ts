import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ChatMessageDto } from "./dto/chat-message.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("messages")
  getMessages(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getMessages(user.id);
  }

  @Post()
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChatMessageDto) {
    return this.chatService.reply(user.id, dto.message);
  }
}
