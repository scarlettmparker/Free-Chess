import { useState } from 'react';
import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@sun/components';
import type { AdminUserSession } from '~/utils/admin-user-types';
import styles from './admin-user-sessions.module.css';

type AdminUserSessionsProps = {
  /**
   * Account whose sessions are shown.
   */
  userId: string;
  /**
   * Revokes one session by token.
   */
  onRevoke: (sessionToken: string) => Promise<void>;
  /**
   * Revokes every session for the account.
   */
  onRevokeAll: () => Promise<void>;
};

/**
 * Active sessions for an account.
 */
const AdminUserSessions = (props: AdminUserSessionsProps) => {
  const { userId, onRevoke, onRevokeAll } = props;
  const { t } = useTranslation('admin');
  const { data: sessions } = usePageData<AdminUserSession[]>(
    'adminUserSessions',
    'adminUserSessions',
    { id: userId },
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const revoke = async (sessionToken: string) => {
    setPending(sessionToken);
    setError(null);
    try {
      await onRevoke(sessionToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('action-failed'));
    } finally {
      setPending(null);
    }
  };

  const revokeAll = async () => {
    setPending('all');
    setError(null);
    try {
      await onRevokeAll();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('action-failed'));
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sessions-title')}</CardTitle>
        <CardDescription>{t('user-sessions-description')}</CardDescription>
      </CardHeader>
      <CardBody>
        <div className={styles.list_body}>
          {!sessions?.length ? (
            <p className={styles.no_items}>{t('no-user-sessions')}</p>
          ) : (
            <ul className={styles.list}>
              {sessions.map((session) => (
                <li key={session.id} className={styles.item}>
                  <div className={styles.session}>
                    <span className={styles.meta}>
                      {session.ipAddress ?? t('unknown')} · {session.userAgent ?? t('unknown')}
                    </span>
                    <span className={styles.dates}>
                      {session.createdAt} → {session.expiresAt}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending !== null}
                    onClick={() => void revoke(session.token)}
                  >
                    {t('revoke')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </CardBody>
      <CardFooter>
        <Button
          type="button"
          variant="destructive"
          disabled={!sessions?.length || pending !== null}
          onClick={() => void revokeAll()}
        >
          {t('revoke-all')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminUserSessions;
