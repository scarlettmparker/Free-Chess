import { Suspense } from 'react';
import SessionList from '~/components/admin/session-list';
import AdminCardSkeleton from '~/components/admin/admin-card-skeleton';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';
import styles from './admin.module.css';

/**
 * Game administration page.
 */
const Admin = () => (
  <Suspense fallback={<AdminPageSkeleton />}>
    <div className={styles.layout}>
      <div className={styles.panel}>
        <Suspense fallback={<AdminCardSkeleton />}>
          <SessionList />
        </Suspense>
      </div>
    </div>
  </Suspense>
);

export default Admin;
