import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { EnvironmentModule } from '../../platform/config/environment.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { PrivacyModule } from '../privacy/privacy.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import {
  GithubIssueGatewayFactory,
  githubIssueGatewayProvider,
} from './infrastructure/github-issue.gateway.factory.js';
import { GITHUB_ISSUE_GATEWAY } from './infrastructure/github-issue.gateway.interface.js';
import { MockGithubIssueGateway } from './infrastructure/mock-github-issue.gateway.js';
import { FeedbackRepository } from './infrastructure/feedback.repository.js';
import { FeedbackService } from './application/feedback.service.js';
import { FeedbackController } from './presentation/feedback.controller.js';
import { FeedbackAdminController } from './presentation/feedback-admin.controller.js';

@Module({
  imports: [
    DatabaseModule,
    EnvironmentModule,
    SettingsModule,
    PrivacyModule,
    IdentityModule,
  ],
  controllers: [FeedbackController, FeedbackAdminController],
  providers: [
    GithubIssueGatewayFactory,
    githubIssueGatewayProvider,
    MockGithubIssueGateway,
    FeedbackRepository,
    FeedbackService,
  ],
  exports: [GITHUB_ISSUE_GATEWAY, FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
