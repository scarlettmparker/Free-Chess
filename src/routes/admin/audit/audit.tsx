import { Suspense } from 'react';
import { useTranslation } from '@sun/i18n';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Skeleton,
} from '@sun/components';
import AuditLog from '~/components/admin/audit-log';
import styles from './audit.module.css';

/**
 * Read-only audit log page.
 */
const Audit = () => {
  const { t } = useTranslation('admin');

  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <div className={styles.layout}>
        <Card>
          <CardHeader>
            <CardTitle>{t('audit-title')}</CardTitle>
            <CardDescription>{t('audit-description')}</CardDescription>
          </CardHeader>
          <CardBody>
            <ScrollArea maxHeight="80vh">
              <Suspense fallback={<Skeleton />}>
                <AuditLog />
              </Suspense>
            </ScrollArea>
          </CardBody>
        </Card>
      </div>
    </Suspense>
  );
};

export default Audit;
