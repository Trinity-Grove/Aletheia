'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { NotificationItemResponseDto, NotificationType } from '@aletheia/contracts';

export interface NotificationBellProps {
  notifications: NotificationItemResponseDto[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead?: (() => Promise<void>) | undefined;
}

const TYPE_ICONS_AND_LABELS: Record<NotificationType, { icon: React.ReactNode; label: string }> = {
  DEVOTIONAL_REMINDER: { icon: <AletheiaIcon name="book-open" size={16} style={{ color: 'var(--color-amber-600)' }} />, label: 'Devocional' },
  DAILY_SCHEDULE_REMINDER: { icon: <AletheiaIcon name="clock" size={16} style={{ color: 'var(--color-indigo-600)' }} />, label: 'Cronograma' },
  ATTENDANCE_MISSING_REMINDER: { icon: <AletheiaIcon name="clipboard-check" size={16} style={{ color: 'var(--color-emerald-600)' }} />, label: 'Frequência' },
  PRAYER_ANSWERED_ALERT: { icon: <AletheiaIcon name="heart" size={16} style={{ color: 'var(--color-rose-600)' }} />, label: 'Oração Respondida' },
  SYSTEM_NOTICE: { icon: <AletheiaIcon name="bell" size={16} style={{ color: 'var(--color-indigo-600)' }} />, label: 'Aviso do Sistema' },
};

function formatTimestamp(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
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
      await onMarkAsRead(id);
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
        aria-label={`Notificações (${unreadCount} não lidas)`}
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
        <span aria-label="Sino" style={{ display: 'inline-flex', alignItems: 'center' }}>
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
                Notificações
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
                  {unreadCount} novas
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
                Marcar lidas
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
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((item) => {
                const meta = TYPE_ICONS_AND_LABELS[item.type] || {
                  icon: <AletheiaIcon name="bell" size={16} />,
                  label: 'Notificação',
                };
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
                      {meta.icon}
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
                          {formatTimestamp(item.createdAt)}
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
                          {meta.label}
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
                            Marcar como lida
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
