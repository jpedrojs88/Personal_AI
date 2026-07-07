import {
  Injectable,
  type NestMiddleware,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { NextFunction, Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./auth-user.type";

type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser;
};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authorization.replace("Bearer ", "").trim();

    try {
      const jwtSecret = this.configService.get<string>("JWT_SECRET")?.trim();

      if (!jwtSecret) {
        throw new Error("JWT_SECRET nao configurado.");
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: jwtSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (user) {
        request.authUser = user;
      }
    } catch {
      request.authUser = undefined;
    }

    next();
  }
}
