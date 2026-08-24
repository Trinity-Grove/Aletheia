import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/auth.service.js';
import { PasswordHasher } from './application/password.hasher.js';
import { IDENTITY_PUBLIC_API } from './application/public-api.js';
import { UserRepository } from './infrastructure/user.repository.js';
import { AuthController } from './presentation/auth.controller.js';
import { JwtAuthGuard } from '../../platform/auth/index.js';
import { DatabaseModule } from '../../platform/database/database.module.js';

@Global()
@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'aletheia_dev_jwt_secret_key_1234567890',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PasswordHasher,
    UserRepository,
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
