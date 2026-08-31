import type { FastifyReply } from 'fastify';
import type { Environment } from '../config/environment.js';

export const SESSION_COOKIE_NAME = 'aletheia_session';

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

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
    maxAge: SEVEN_DAYS_IN_SECONDS,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}
