import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Credenciales inválidas');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      // Try to link to existing account
      const existingUser = await this.usersService.findByEmail(
        googleUser.email,
      );
      if (existingUser) {
        user = await this.usersService.linkGoogleAccount(
          existingUser.id,
          googleUser.googleId,
          googleUser.avatar,
        );
      } else {
        // Auto-register new user with Google
        user = await this.usersService.createFromGoogle({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
        });
      }
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(userId: string, rt: string) {
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshToken)
      throw new ForbiddenException('Acceso denegado');

    const matches = await bcrypt.compare(rt, user.refreshToken);
    if (!matches) throw new ForbiddenException('Acceso denegado');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    const hashedRt = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRt);

    return { accessToken, refreshToken };
  }
}
