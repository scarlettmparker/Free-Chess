import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { executeMutation, makeCacheKey, revalidatePageData } from '@sun/ssr';
import { usePageData } from '@sun/ssr/react';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectOption,
} from '@sun/components';
import AdminUserSessions from '~/components/admin/admin-user-sessions';
import ConfirmBanDialog from '~/components/admin/confirm-ban-dialog';
import ConfirmDeleteUserDialog from '~/components/admin/confirm-delete-user-dialog';
import EditUserDialog from '~/components/admin/edit-user-dialog';
import ResetPasswordDialog from '~/components/admin/reset-password-dialog';
import type { AdminUser, EditUserValues } from '~/utils/admin-user-types';
import { ROLE_OPTIONS } from '~/utils/roles';
import styles from './admin-user-detail.module.css';

type AdminUserDetailProps = {
  /**
   * Account to display.
   */
  userId: string;
};

type UserDialog = 'edit' | 'password' | 'ban' | 'delete' | null;

/**
 * Account fields, role control, and destructive actions.
 */
const AdminUserDetail = (props: AdminUserDetailProps) => {
  const { userId } = props;
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: user } = usePageData<AdminUser | null>('adminUser', 'adminUser', {
    id: userId,
  });
  const [roleDraft, setRoleDraft] = useState<string | null>(null);
  const [dialog, setDialog] = useState<UserDialog>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    const page = String(Number(searchParams.get('page') ?? '0') || 0);
    const search = searchParams.get('search') ?? '';
    revalidatePageData([
      makeCacheKey('adminUser', { id: userId }),
      makeCacheKey('adminUserSessions', { id: userId }),
      makeCacheKey('adminUsers', { page, search: search || undefined }),
    ]);
  };

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await action();
      setMessage(done);
      refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('action-failed'));
    } finally {
      setBusy(false);
    }
  };

  const saveDetails = async (values: EditUserValues) => {
    await executeMutation<AdminUser>('user/update', {
      userId,
      name: values.name,
      email: values.email,
    });
    setMessage(t('saved'));
    refresh();
  };

  const resetPassword = async (password: string) => {
    await executeMutation('user/set-password', { userId, password });
    setMessage(t('password-updated'));
  };

  const ban = async (reason: string, expiresInDays?: number) => {
    await executeMutation<AdminUser>('user/ban', { userId, reason, expiresInDays });
    setMessage(t('banned'));
    refresh();
  };

  const remove = async () => {
    await executeMutation('user/delete', { userId });
    const page = String(Number(searchParams.get('page') ?? '0') || 0);
    const search = searchParams.get('search') ?? '';
    revalidatePageData([makeCacheKey('adminUsers', { page, search: search || undefined })]);
    navigate({ pathname: '/admin/users', search: searchParams.toString() });
  };

  const revokeSession = async (sessionToken: string) => {
    await executeMutation('session/revoke', { sessionToken });
    revalidatePageData([makeCacheKey('adminUserSessions', { id: userId })]);
  };

  const revokeAll = async () => {
    await executeMutation('session/revoke-all', { userId });
    revalidatePageData([makeCacheKey('adminUserSessions', { id: userId })]);
  };

  if (!user) {
    return (
      <Card>
        <CardBody>
          <p>{t('user-not-found')}</p>
        </CardBody>
      </Card>
    );
  }

  const currentRole =
    user.role
      .split(',')
      .map((value) => value.trim())
      .find((value) => ROLE_OPTIONS.includes(value as (typeof ROLE_OPTIONS)[number])) ?? 'user';
  const role = roleDraft ?? currentRole;
  const roles = user.role
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => t(`role-${value}`) as string)
    .join(', ');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{user.email}</CardTitle>
          <CardDescription>{user.name}</CardDescription>
        </CardHeader>
        <CardBody>
          <div className={styles.fields}>
            <div className={styles.field}>
              <span className={styles.label}>{t('role')}</span>
              <span>{roles}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t('status')}</span>
              <span>{user.banned ? t('status-banned') : t('status-active')}</span>
            </div>
            {user.banned && (
              <div className={styles.field}>
                <span className={styles.label}>{t('ban-reason')}</span>
                <span>{user.banReason ?? t('none')}</span>
              </div>
            )}
            <div className={styles.field}>
              <span className={styles.label}>{t('created')}</span>
              <span>{user.createdAt}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t('updated')}</span>
              <span>{user.updatedAt}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>{t('user-id')}</span>
              <span className={styles.mono}>{user.id}</span>
            </div>
          </div>
          <div className={styles.role_row}>
            <Select value={role} onChange={(event) => setRoleDraft(event.currentTarget.value)}>
              {ROLE_OPTIONS.map((option) => (
                <SelectOption key={option} value={option}>
                  {t(`role-${option}`)}
                </SelectOption>
              ))}
            </Select>
            <Button
              type="button"
              disabled={busy || role === currentRole}
              onClick={() =>
                void run(async () => {
                  await executeMutation<AdminUser>('user/set-role', { userId, role });
                  setRoleDraft(null);
                }, t('role-updated'))
              }
            >
              {t('save-role')}
            </Button>
          </div>
          {message && <p className={styles.message}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </CardBody>
        <CardFooter>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setDialog('edit')}>
              {t('edit-user')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDialog('password')}>
              {t('reset-password')}
            </Button>
            {user.banned ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(() => executeMutation('user/unban', { userId }), t('unbanned'))
                }
              >
                {t('unban')}
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={() => setDialog('ban')}>
                {t('ban')}
              </Button>
            )}
            <Button type="button" variant="destructive" onClick={() => setDialog('delete')}>
              {t('delete')}
            </Button>
          </div>
        </CardFooter>
      </Card>
      <AdminUserSessions userId={userId} onRevoke={revokeSession} onRevokeAll={revokeAll} />
      {dialog === 'edit' && (
        <EditUserDialog open user={user} onClose={() => setDialog(null)} onSubmit={saveDetails} />
      )}
      {dialog === 'password' && (
        <ResetPasswordDialog
          open
          email={user.email}
          onClose={() => setDialog(null)}
          onSubmit={resetPassword}
        />
      )}
      {dialog === 'ban' && (
        <ConfirmBanDialog open email={user.email} onClose={() => setDialog(null)} onConfirm={ban} />
      )}
      {dialog === 'delete' && (
        <ConfirmDeleteUserDialog
          open
          email={user.email}
          onClose={() => setDialog(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
};

export default AdminUserDetail;
