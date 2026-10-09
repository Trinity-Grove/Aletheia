'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { NotificationItemResponseDto, NotificationType } from '@aletheia/contracts';
import { useLocale, type LocaleContextValue } from '../../lib/i18n/locale-context';

export interface NotificationBellProps {
  notifications: NotificationItemResponseDto[];
  unreadCount: number;
  onMarkAsRead?(id: string): Promise<void>;
  onMarkAllAsRead?(): Promise<void>;
}

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  DEVOTIONAL_REMINDER: <AletheiaIcon name="book-open" size={16} style={{ color: 'var(--color-amber-600)' }} />,
  DAILY_SCHEDULE_REMINDER: <AletheiaIcon name="clock" size={16} style={{ color: 'var(--color-indigo-600)' }} />,
  ATTENDANCE_MISSING_REMINDER: <AletheiaIcon name="clipboard-check" size={16} style={{ color: 'var(--color-emerald-600)' }} />,
  PRAYER_ANSWERED_ALERT: <AletheiaIcon name="heart" size={16} style={{ color: 'var(--color-rose-600)' }} />,
  SYSTEM_NOTICE: <AletheiaIcon name="bell" size={16} style={{ color: 'var(--color-indigo-600)' }} />,
  FEEDBACK_APPROVED: <AletheiaIcon name="check-circle" size={16} style={{ color: 'var(--color-emerald-600)' }} />,
  FEEDBACK_REJECTED: <AletheiaIcon name="x-circle" size={16} style={{ color: 'var(--color-rose-600)' }} />,
};

const TYPE_LABEL_KEYS: Record<NotificationType, string> = {
  DEVOTIONAL_REMINDER: 'notifications.typeDevotionalReminder',
  DAILY_SCHEDULE_REMINDER: 'notifications.typeDailyScheduleReminder',
  ATTENDANCE_MISSING_REMINDER: 'notifications.typeAttendanceMissingReminder',
  PRAYER_ANSWERED_ALERT: 'notifications.typePrayerAnsweredAlert',
  SYSTEM_NOTICE: 'notifications.typeSystemNotice',
  FEEDBACK_APPROVED: 'notifications.typeFeedbackApproved',
  FEEDBACK_REJECTED: 'notifications.typeFeedbackRejected',
};

function formatTimestamp(dateStr: string | Date | undefined, t: LocaleContextValue['t']): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return t('notifications.timeJustNow');
  if (diffInMinutes < 60) return t('notifications.timeMinutesAgo', { count: diffInMinutes });
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return t('notifications.timeHoursAgo', { count: diffInHours });
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setIsProcessing(true);
      await onMarkAsRead?.(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAll = async () => {
    if (!onMarkAllAsRead) return;
    try {
      setIsProcessing(true);
      await onMarkAllAsRead();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="notification-bell-container"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        type="button"
        data-testid="notification-bell-btn"
        aria-label={t('notifications.bellAriaLabel', { count: unreadCount })}
        aria-expanded={isOpen}
        onClick={handleToggle}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '1.125rem',
          transition: 'all 0.15s ease-in-out',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span aria-label={t('notifications.iconAriaLabel')} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <AletheiaIcon name="bell" size={18} />
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              backgroundColor: 'var(--color-rose-600)',
              color: 'var(--text-inverse)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              minWidth: '1.25rem',
              height: '1.25rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.25rem',
              boxShadow: '0 0 0 2px var(--bg-surface)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            width: '360px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-light)',
            zIndex: 50,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px',
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                {t('notifications.title')}
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-indigo-50)',
                    color: 'var(--color-indigo-600)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {t('notifications.newCount', { count: unreadCount })}
                </span>
              )}
            </div>

            {onMarkAllAsRead && unreadCount > 0 && (
              <button
                type="button"
                data-testid="mark-all-read-btn"
                onClick={handleMarkAll}
                disabled={isProcessing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-indigo-600)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: isProcessing ? 'wait' : 'pointer',
                  padding: 0,
                }}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                data-testid="notifications-empty"
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ color: 'var(--sage)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <AletheiaIcon name="sparkles" size={28} />
                </div>
                {t('notifications.empty')}
              </div>
            ) : (
              notifications.map((item) => {
                const icon = TYPE_ICONS[item.type] ?? <AletheiaIcon name="bell" size={16} />;
                const label = TYPE_LABEL_KEYS[item.type]
                  ? t(TYPE_LABEL_KEYS[item.type])
                  : t('notifications.typeFallback');
                return (
                  <div
                    key={item.id}
                    data-testid={`notification-item-${item.id}`}
                    style={{
                      padding: '0.875rem 1.125rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      backgroundColor: item.isRead ? 'var(--bg-surface)' : 'var(--color-emerald-50)',
                      borderBottom: '1px solid var(--border-light)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', lineHeight: 1, marginTop: '0.125rem' }}>
                      {icon}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: item.isRead ? 600 : 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatTimestamp(item.createdAt, t)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {item.message}
                      </p>
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          data-testid={`notification-link-${item.id}`}
                          style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--color-indigo-600)', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {t('notifications.openLink')}
                        </a>
                      )}

                      <div
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--sage-soft)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 500,
                          }}
                        >
                          {label}
                        </span>

                        {!item.isRead && (
                          <button
                            type="button"
                            data-testid={`mark-read-btn-${item.id}`}
                            onClick={(e) => handleMarkOne(e, item.id)}
                            disabled={isProcessing}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-indigo-600)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '0.125rem 0.25rem',
                            }}
                          >
                            {t('notifications.markAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
