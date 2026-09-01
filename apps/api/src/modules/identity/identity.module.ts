import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/auth.service.js';
import { PasswordHasher } from './application/password.hasher.js';
import { IDENTITY_PUBLIC_API } from './application/public-api.js';
import { UserRepository } from './infrastructure/user.repository.js';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository.js';
import { EmailVerificationTokenRepository } from './infrastructure/email-verification-token.repository.js';
import { AuthController } from './presentation/auth.controller.js';
import { JwtAuthGuard } from '../../platform/auth/index.js';
import { ENVIRONMENT, type Environment } from '../../platform/config/environment.js';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { MailModule } from '../../platform/mail/mail.module.js';

@Global()
@Module({
  imports: [
    DatabaseModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ENVIRONMENT],
      useFactory: (environment: Environment) => ({
        secret: environment.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordHasher,
    UserRepository,
    RefreshTokenRepository,
    EmailVerificationTokenRepository,
    AuthService,
    JwtAuthGuard,
    {
      provide: IDENTITY_PUBLIC_API,
      useExisting: AuthService,
    },
  ],
  exports: [IDENTITY_PUBLIC_API, AuthService, JwtAuthGuard],
})
export class IdentityModule {}
