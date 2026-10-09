import { Injectable, Optional, type Provider } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import { GithubIssueGateway } from './github-issue.gateway.js';
import {
  GITHUB_ISSUE_GATEWAY,
  type GithubIssueGateway as GithubIssueGatewayContract,
} from './github-issue.gateway.interface.js';
import { MockGithubIssueGateway } from './mock-github-issue.gateway.js';

@Injectable()
export class GithubIssueGatewayFactory {
  constructor(@Optional() private readonly config?: ConfigService) {}

  create(): GithubIssueGatewayContract {
    const provider =
      this.config?.get('GITHUB_ISSUE_PROVIDER') ?? process.env['GITHUB_ISSUE_PROVIDER'];
    const token = this.config?.get('GITHUB_TOKEN') ?? process.env['GITHUB_TOKEN'];
    const isProduction =
      (this.config?.get('NODE_ENV') ?? process.env['NODE_ENV']) === 'production';

    // Deliberate deviation from DonationGatewayFactory: there, a missing
    // token silently downgrades to a mock because a fake donation is
    // business. Here a fake approval is silently-lost admin work, so
    // production always demands a real token.
    if (provider === 'github' || isProduction) {
      if (!token) {
        throw new Error(
          'GITHUB_TOKEN is required to open GitHub issues from feedback approvals. ' +
            'Refusing to fall back to the mock gateway: an approval would report success without a real issue.',
        );
      }
      return new GithubIssueGateway(this.config);
    }

    return new MockGithubIssueGateway();
  }
}

export const githubIssueGatewayProvider: Provider = {
  provide: GITHUB_ISSUE_GATEWAY,
  inject: [{ token: ConfigService, optional: true }],
  useFactory: (config?: ConfigService): GithubIssueGatewayContract =>
    new GithubIssueGatewayFactory(config).create(),
};

export { ConfigService };