import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user.type";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpsertProfileDto } from "../profile/dto/upsert-profile.dto";
import { CompleteExerciseDto } from "./dto/complete-exercise.dto";
import { WorkoutsService } from "./workouts.service";

@Controller("workouts")
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post("bootstrap")
  bootstrap(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertProfileDto) {
    return this.workoutsService.bootstrapPlanForUser(user.id, dto);
  }

  @Post("generate")
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertProfileDto) {
    return this.workoutsService.generatePlanForUser(user.id, dto);
  }

  @Get("today")
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.workoutsService.getTodayWorkout(user.id);
  }

  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.workoutsService.getWorkoutHistory(user.id);
  }

  @Post("complete-exercise")
  completeExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteExerciseDto,
  ) {
    return this.workoutsService.completeExercise(user.id, dto.workoutExerciseId, dto);
  }
}
