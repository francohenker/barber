import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator<
  keyof AuthenticatedUser | undefined
>((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
  const user = request.user;

  if (data && user) {
    return user[data];
  }

  return user;
});
