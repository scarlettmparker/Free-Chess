import { Suspense } from 'react';
import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Skeleton } from '@sun/components';
import AuditLog from '~/components/admin/audit-log';
import styles from './audit.module.css';

/**
 * Read-only audit log page.
 */
const Audit = () => {
  const { t } = useTranslation('admin');

  return (
    <div className={styles.layout}>
      <Card>
        <CardHeader>
          <CardTitle>{t('audit-title')}</CardTitle>
          <CardDescription>{t('audit-description')}</CardDescription>
        </CardHeader>
        <CardBody>
          <Suspense fallback={<Skeleton />}>
            <AuditLog />
          </Suspense>
        </CardBody>
      </Card>
    </div>
  );
};

export default Audit;
