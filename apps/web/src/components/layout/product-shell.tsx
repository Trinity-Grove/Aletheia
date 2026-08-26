'use client';

import React, { type ReactNode } from 'react';
import type { LearnerSummaryDto, NotificationItemResponseDto } from '@aletheia/contracts';
import { NotificationBell } from './notification-bell';

export interface LearnerFocusSwitcherProps {
  learners: LearnerSummaryDto[];
  activeLearnerId: string | null;
  onSelectLearner: (learnerId: string | null) => void;
}

export function LearnerFocusSwitcher({
  learners,
  activeLearnerId,
  onSelectLearner,
}: LearnerFocusSwitcherProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectLearner(value ? value : null);
  };

  return (
    <div className="learner-focus-switcher" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <select
        data-testid="learner-focus-select"
        value={activeLearnerId ?? ''}
        onChange={handleChange}
        style={{
          padding: '0.375rem 0.75rem',
          borderRadius: '0.375rem',
          border: '1px solid #D1D5DB',
          backgroundColor: '#FFFFFF',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        <option value="">👨‍👩‍👧‍👦 Toda a Família</option>
        {learners.map((learner) => {
          const displayName = learner.preferredName || learner.firstName;
          return (
            <option key={learner.id} value={learner.id}>
              🎓 {displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export interface ProductShellProps {
  children: ReactNode;
  learners?: LearnerSummaryDto[] | undefined;
  activeLearnerId?: string | null | undefined;
  onSelectLearner?: ((learnerId: string | null) => void) | undefined;
  notifications?: NotificationItemResponseDto[] | undefined;
  unreadCount?: number | undefined;
  onMarkNotificationAsRead?: ((id: string) => Promise<void>) | undefined;
  onMarkAllNotificationsAsRead?: (() => Promise<void>) | undefined;
}

export function ProductShell({
  children,
  learners,
  activeLearnerId = null,
  onSelectLearner,
  notifications,
  unreadCount = 0,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
}: ProductShellProps) {
  return (
    <div className="product-shell" style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <strong style={{ fontSize: '1.25rem', color: '#1F2937', letterSpacing: '-0.025em' }}>
            Aletheia
          </strong>

          <nav
            style={{
              display: 'none',
              gap: '1rem',
              alignItems: 'center',
            }}
            className="main-navigation"
          >
            <a
              href="/learners"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Educandos
            </a>
            <a
              href="/curriculum"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Currículo
            </a>
            <a
              href="/schedule"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Cronograma
            </a>
            <a
              href="/devotional"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Devocional
            </a>
            <a
              href="/records"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Registros & Domínio
            </a>
            <a
              href="/reports"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Relatórios & Presença
            </a>
            <a
              href="/settings"
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}
            >
              Configurações
            </a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {learners && onSelectLearner && (
            <LearnerFocusSwitcher
              learners={learners}
              activeLearnerId={activeLearnerId}
              onSelectLearner={onSelectLearner}
            />
          )}

          {notifications !== undefined && onMarkNotificationAsRead && (
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={onMarkNotificationAsRead}
              {...(onMarkAllNotificationsAsRead !== undefined ? { onMarkAllAsRead: onMarkAllNotificationsAsRead } : {})}
            />
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
