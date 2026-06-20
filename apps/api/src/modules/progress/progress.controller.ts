import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LogLoadDto } from "./dto/log-load.dto";
import { LogWeightDto } from "./dto/log-weight.dto";
import { ProgressHistoryQueryDto } from "./dto/progress-history-query.dto";
import { ProgressService } from "./progress.service";

@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post("weight")
  logWeight(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogWeightDto) {
    return this.progressService.logWeight(user.id, dto);
  }

  @Post("load")
  logLoad(@CurrentUser() user: AuthenticatedUser, @Body() dto: LogLoadDto) {
    return this.progressService.logLoad(user.id, dto);
  }

  @Get("history")
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProgressHistoryQueryDto,
  ) {
    return this.progressService.getHistory(user.id, query);
  }
}
