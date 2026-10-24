import { useTranslation } from '@sun/i18n';
import { makeCacheKey, revalidatePageData } from '@sun/ssr';
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
import RoleCheck from '~/utils/role-check';
import type { AdminSession } from '~/utils/admin-command';
import styles from './session-list.module.css';

/**
 * Formats a disconnect time without depending on the viewer's timezone.
 *
 * @param value Timestamp, or null while connected.
 * @returns Stable UTC label.
 */
const formatDisconnectedAt = (value: number | null) => {
  if (value === null) return '-';
  return `${new Date(value).toISOString().replace('T', ' ').slice(0, 19)} UTC`;
};

/**
 * Current matchmaking sessions.
 */
const SessionList = () => (
  <RoleCheck roles={['admin', 'game-admin']} match="any">
    <SessionListContent />
  </RoleCheck>
);

/**
 * Session rows loaded from the matchmaking admin API.
 */
const SessionListContent = () => {
  const { t } = useTranslation('admin');
  const { data: sessions } = usePageData<AdminSession[]>('adminSessions', 'adminSessions', {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sessions-title')}</CardTitle>
        <CardDescription>{t('sessions-description')}</CardDescription>
      </CardHeader>
      <CardBody>
        <div className={styles.list_body}>
          {!sessions?.length ? (
            <p className={styles.no_items}>{t('no-sessions')}</p>
          ) : (
            <ul className={styles.list}>
              {sessions.map((session) => (
                <li key={session.sessionId} className={styles.item}>
                  <span className={styles.id}>{session.sessionId}</span>
                  <span>{session.color}</span>
                  <span>{session.connected ? t('connected') : t('disconnected')}</span>
                  <span className={styles.time}>
                    {formatDisconnectedAt(session.disconnectedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
      <CardFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={() => revalidatePageData([makeCacheKey('adminSessions', {})])}
        >
          {t('refresh')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SessionList;
