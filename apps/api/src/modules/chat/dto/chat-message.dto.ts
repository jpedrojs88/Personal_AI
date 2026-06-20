import { IsString, MaxLength } from "class-validator";

export class ChatMessageDto {
  @IsString()
  @MaxLength(1000)
  message!: string;
}
