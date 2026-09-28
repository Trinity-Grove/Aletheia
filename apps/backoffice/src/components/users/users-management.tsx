'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { AdminUserSummaryDto, ListUsersResponseDto } from '@aletheia/contracts';
import { Badge, Button, Input, Modal } from '@aletheia/ui';
import { api } from '../../lib/api';
import { useAdminAuth } from '../../lib/auth/admin-auth-context';

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'medium' });
}

export function UsersManagement(): React.ReactElement {
  const { user: currentAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserSummaryDto | null>(null);
  const [editingFullName, setEditingFullName] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, string | number> = { skip, take: PAGE_SIZE };
      if (search.trim()) {
        params.search = search.trim();
      }
      const data = await api.get<ListUsersResponseDto>('/admin/users', { params });
      setUsers(data.users);
      setTotalCount(data.totalCount);
    } catch {
      setErrorMessage('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  }, [skip, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    loadUsers();
  };

  const runAction = async (userId: string, action: () => Promise<unknown>) => {
    setActionUserId(userId);
    setErrorMessage(null);
    try {
      await action();
      await loadUsers();
    } catch {
      setErrorMessage('A ação não pôde ser concluída. Tente novamente.');
    } finally {
      setActionUserId(null);
    }
  };

  const openEditModal = (targetUser: AdminUserSummaryDto) => {
    setEditingUser(targetUser);
    setEditingFullName(targetUser.fullName);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await runAction(editingUser.id, () =>
      api.patch(`/admin/users/${editingUser.id}`, { fullName: editingFullName }),
    );
    setEditingUser(null);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--line, #e2e8f0)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
          Gestão de Usuários
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted, #64748b)' }}>
          Contas de guardiões cadastradas na plataforma — {totalCount} no total.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '420px' }}>
        <Input
          type="search"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar usuários"
        />
        <Button type="submit" variant="secondary" isLoading={loading}>
          Buscar
        </Button>
      </form>

      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.875rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid var(--line, #e2e8f0)', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Nome</th>
              <th style={{ padding: '0.75rem 1rem' }}>E-mail</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Cadastro</th>
              <th style={{ padding: '0.75rem 1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((targetUser) => {
              const isSelf = currentAdmin?.id === targetUser.id;
              const isBusy = actionUserId === targetUser.id;
              return (
                <tr key={targetUser.id} style={{ borderTop: '1px solid var(--line, #e2e8f0)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                    {targetUser.fullName}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{targetUser.email}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {targetUser.disabled && (
                        <Badge variant="rose" size="sm">Desativado</Badge>
                      )}
                      {!targetUser.emailVerified && (
                        <Badge variant="amber" size="sm">E-mail não verificado</Badge>
                      )}
                      {targetUser.isPlatformAdmin && (
                        <Badge variant="indigo" size="sm">Admin</Badge>
                      )}
                      {!targetUser.disabled && targetUser.emailVerified && !targetUser.isPlatformAdmin && (
                        <Badge variant="emerald" size="sm">Ativo</Badge>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{formatDate(targetUser.createdAt)}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => openEditModal(targetUser)}
                      >
                        Editar
                      </Button>

                      {!isSelf && (
                        targetUser.isPlatformAdmin ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => {
                              if (window.confirm(`Remover privilégios de admin de ${targetUser.fullName}?`)) {
                                runAction(targetUser.id, () => api.post(`/admin/users/${targetUser.id}/demote`));
                              }
                            }}
                          >
                            Rebaixar admin
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => runAction(targetUser.id, () => api.post(`/admin/users/${targetUser.id}/promote`))}
                          >
                            Promover admin
                          </Button>
                        )
                      )}

                      {!isSelf && (
                        targetUser.disabled ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => runAction(targetUser.id, () => api.post(`/admin/users/${targetUser.id}/reactivate`))}
                          >
                            Reativar
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => {
                              if (window.confirm(`Desativar a conta de ${targetUser.fullName}? Todas as sessões ativas serão encerradas.`)) {
                                runAction(targetUser.id, () => api.post(`/admin/users/${targetUser.id}/disable`));
                              }
                            }}
                          >
                            Desativar
                          </Button>
                        )
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        isLoading={isBusy}
                        onClick={() => {
                          if (window.confirm(`Enviar e-mail de redefinição de senha para ${targetUser.email}?`)) {
                            runAction(targetUser.id, () => api.post(`/admin/users/${targetUser.id}/force-password-reset`));
                          }
                        }}
                      >
                        Redefinir senha
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          Página {currentPage} de {totalPages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={skip === 0 || loading}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={skip + PAGE_SIZE >= totalCount || loading}
            onClick={() => setSkip(skip + PAGE_SIZE)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Modal
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title="Editar usuário"
        description={editingUser?.email}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-user-form" isLoading={actionUserId === editingUser?.id}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label htmlFor="edit-user-fullname" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
            Nome completo
          </label>
          <Input
            id="edit-user-fullname"
            value={editingFullName}
            onChange={(e) => setEditingFullName(e.target.value)}
            required
          />
        </form>
      </Modal>
    </div>
  );
}
