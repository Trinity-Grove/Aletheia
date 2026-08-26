'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { NotificationItemResponseDto, NotificationType } from '@aletheia/contracts';

export interface NotificationBellProps {
  notifications: NotificationItemResponseDto[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead?: (() => Promise<void>) | undefined;
}

const TYPE_ICONS_AND_LABELS: Record<NotificationType, { icon: string; label: string }> = {
  DEVOTIONAL_REMINDER: { icon: '📖', label: 'Devocional' },
  DAILY_SCHEDULE_REMINDER: { icon: '⏰', label: 'Cronograma' },
  ATTENDANCE_MISSING_REMINDER: { icon: '📋', label: 'Frequência' },
  PRAYER_ANSWERED_ALERT: { icon: '🙏', label: 'Oração Respondida' },
  SYSTEM_NOTICE: { icon: '🔔', label: 'Aviso do Sistema' },
};

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
          borderRadius: '0.5rem',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          color: '#374151',
          cursor: 'pointer',
          fontSize: '1.25rem',
          transition: 'all 0.15s ease-in-out',
        }}
      >
        <span role="img" aria-label="Sino">
          🔔
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.6875rem',
              fontWeight: 700,
              minWidth: '1.25rem',
              height: '1.25rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.25rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
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
            width: '24rem',
            maxWidth: '90vw',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1rem',
              borderBottom: '1px solid #F3F4F6',
              backgroundColor: '#F9FAFB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                Notificações
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#E0E7FF',
                    color: '#4338CA',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                type="button"
                data-testid="mark-all-read-btn"
                onClick={handleMarkAll}
                disabled={isProcessing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div
            style={{
              maxHeight: '22rem',
              overflowY: 'auto',
            }}
          >
            {notifications.length === 0 ? (
              <div
                data-testid="notifications-empty"
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: '#6B7280',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((item) => {
                const meta = TYPE_ICONS_AND_LABELS[item.type] || {
                  icon: '🔔',
                  label: 'Notificação',
                };
                return (
                  <div
                    key={item.id}
                    data-testid={`notification-item-${item.id}`}
                    style={{
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      backgroundColor: item.isRead ? '#FFFFFF' : '#F0F9FF',
                      borderBottom: '1px solid #F3F4F6',
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
                            color: '#111827',
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
                            color: '#9CA3AF',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8125rem',
                          color: '#4B5563',
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
                            color: '#6B7280',
                            backgroundColor: '#E5E7EB',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
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
                              color: '#2563EB',
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
