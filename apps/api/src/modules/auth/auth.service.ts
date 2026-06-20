import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PaymentProvider, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcryptjs";
import type { AuthenticatedUser } from "./auth-user.type";
import { FREE_MONTHLY_MESSAGE_LIMIT } from "../billing/billing.constants";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("Email already in use.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const displayName =
      dto.displayName?.trim() || dto.name?.trim() || dto.email.split("@")[0];

    const user = await this.prisma.user.create({
      data: {
        name: displayName,
        email: dto.email.toLowerCase(),
        password: passwordHash,
        subscription: {
          create: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            monthlyMessageLimit: FREE_MONTHLY_MESSAGE_LIMIT,
            monthlyMessagesUsed: 0,
            paymentProvider: PaymentProvider.MOCK,
            providerCustomerId: `mock-customer-${dto.email.toLowerCase()}`,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    return this.issueToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
    };
  }

  private async issueToken(user: AuthenticatedUser) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.name,
      },
    };
  }
}
