import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ authUser?: unknown }>();

    if (!request.authUser) {
      throw new UnauthorizedException("Authentication required.");
    }

    return true;
  }
}
