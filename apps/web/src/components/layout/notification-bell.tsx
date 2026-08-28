'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  Clock,
  ClipboardCheck,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import type { NotificationItemResponseDto, NotificationType } from '@aletheia/contracts';

export interface NotificationBellProps {
  notifications: NotificationItemResponseDto[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead?: (() => Promise<void>) | undefined;
}

const TYPE_ICONS_AND_LABELS: Record<NotificationType, { icon: React.ReactNode; label: string }> = {
  DEVOTIONAL_REMINDER: { icon: <BookOpen size={16} style={{ color: '#D97706' }} />, label: 'Devocional' },
  DAILY_SCHEDULE_REMINDER: { icon: <Clock size={16} style={{ color: '#2563EB' }} />, label: 'Cronograma' },
  ATTENDANCE_MISSING_REMINDER: { icon: <ClipboardCheck size={16} style={{ color: '#059669' }} />, label: 'Frequência' },
  PRAYER_ANSWERED_ALERT: { icon: <HeartHandshake size={16} style={{ color: '#EC4899' }} />, label: 'Oração Respondida' },
  SYSTEM_NOTICE: { icon: <Bell size={16} style={{ color: '#6366F1' }} />, label: 'Aviso do Sistema' },
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
          borderRadius: '0.625rem',
          border: '1px solid var(--border-light, #E2E8F0)',
          backgroundColor: '#FFFFFF',
          color: '#334155',
          cursor: 'pointer',
          fontSize: '1.125rem',
          transition: 'all 0.15s ease-in-out',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}
      >
        <span aria-label="Sino" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Bell size={18} />
        </span>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              backgroundColor: '#E11D48',
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
              boxShadow: '0 0 0 2px #FFFFFF',
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
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0',
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
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                Notificações
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
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
                  color: '#2563EB',
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
                  color: '#64748B',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ color: 'var(--color-brand-sage, #78937f)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                  <Sparkles size={28} />
                </div>
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((item) => {
                const meta = TYPE_ICONS_AND_LABELS[item.type] || {
                  icon: <Bell size={16} />,
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
                      backgroundColor: item.isRead ? '#FFFFFF' : '#F0FDF4',
                      borderBottom: '1px solid #F1F5F9',
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
                            color: '#0F172A',
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
                            color: '#94A3B8',
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
                          color: '#475569',
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
                            color: '#475569',
                            backgroundColor: '#F1F5F9',
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
                              color: '#4F46E5',
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
