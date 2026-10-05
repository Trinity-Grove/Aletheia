export { FeedbackModule } from './feedback.module.js';
export { FeedbackService } from './application/feedback.service.js';
export { FeedbackRepository } from './infrastructure/feedback.repository.js';
export {
  GITHUB_ISSUE_GATEWAY,
  type GithubIssueGateway,
} from './infrastructure/github-issue.gateway.interface.js';
export { MockGithubIssueGateway } from './infrastructure/mock-github-issue.gateway.js';
export { GithubIssueGatewayFactory } from './infrastructure/github-issue.gateway.factory.js';
export {
  githubIssueGatewayProvider,
  ConfigService as GithubIssueConfigService,
} from './infrastructure/github-issue.gateway.factory.js';
export { FeedbackController } from './presentation/feedback.controller.js';
export { FeedbackAdminController } from './presentation/feedback-admin.controller.js';
