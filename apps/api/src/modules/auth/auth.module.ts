import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { StringValue } from "ms";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = (configService.get<string>("JWT_EXPIRES_IN") ?? "7d") as StringValue;
        const jwtSecret = configService.get<string>("JWT_SECRET")?.trim();

        if (!jwtSecret) {
          throw new Error("JWT_SECRET nao configurado.");
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
