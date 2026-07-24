import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { TokenService } from './token.service';
import { AuthController } from './auth.controller';

/**
 * Глобальный, потому что PasswordService и TokenService нужны модулю users
 * (создание пользователей, приглашения), а JwtModule — глобальному
 * JwtAuthGuard.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    AuthService,
    AccountService,
    PasswordService,
    TotpService,
    TokenService,
  ],
  controllers: [AuthController],
  exports: [PasswordService, TotpService, TokenService, AuthService],
})
export class AuthModule {}
