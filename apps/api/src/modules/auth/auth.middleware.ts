import {
  Injectable,
  type NestMiddleware,
} from "@nestjs/common";
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
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET ?? "change-me",
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
