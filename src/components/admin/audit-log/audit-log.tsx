import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import type { AuditEvent } from '~/utils/audit-types';
import styles from './audit-log.module.css';

/**
 * Formats a timestamp without depending on the viewer's timezone.
 *
 * @param value Unix timestamp in milliseconds.
 * @returns Stable UTC label.
 */
const formatTime = (value: number) =>
  `${new Date(value).toISOString().replace('T', ' ').slice(0, 19)} UTC`;

/**
 * Newest audit entries, newest first.
 */
const AuditLog = () => {
  const { t } = useTranslation('admin');
  const { data } = usePageData<AuditEvent[]>('adminAudit', 'adminAudit', {});

  if (!data?.length) {
    return <p className={styles.empty}>{t('audit-empty')}</p>;
  }

  return (
    <div className={styles.list}>
      {data.map((event) => (
        <div key={event.id} className={styles.row}>
          <span className={styles.time}>{formatTime(event.createdAt)}</span>
          <span className={styles.action}>{event.action}</span>
          <span className={styles.actor}>{event.actorEmail ?? t('unknown')}</span>
          <span className={styles.target}>{event.target ?? t('none')}</span>
          <span className={styles.outcome}>
            {event.outcome === 'success' ? t('audit-success') : t('audit-failure')}
          </span>
          {event.detail && <span className={styles.detail}>{event.detail}</span>}
        </div>
      ))}
    </div>
  );
};

export default AuditLog;
