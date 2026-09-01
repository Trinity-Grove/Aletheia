import type { FastifyReply } from 'fastify';
import type { Environment } from '../config/environment.js';

export const SESSION_COOKIE_NAME = 'aletheia_session';
export const REFRESH_COOKIE_NAME = 'aletheia_refresh';

// Matches the access token's own JWT expiry — the cookie shouldn't outlive
// the token it carries.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Scoped to the auth routes only: nothing else on the API ever needs the
// refresh token, so there's no reason for the browser to send it anywhere
// else.
const REFRESH_COOKIE_PATH = '/api/v1/auth';

export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  environment: Environment,
): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: environment.nodeEnv === 'production',
    sameSite: environment.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export function setRefreshCookie(
  reply: FastifyReply,
  token: string,
  environment: Environment,
): void {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: environment.nodeEnv === 'production',
    sameSite: environment.nodeEnv === 'production' ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
