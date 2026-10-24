import { Suspense } from 'react';
import GameControls from '~/components/admin/game-controls';
import SessionList from '~/components/admin/session-list';
import AdminCardSkeleton from '~/components/admin/admin-card-skeleton';
import styles from './admin.module.css';

/**
 * Game administration page.
 */
const Admin = () => (
  <div className={styles.layout}>
    <div className={styles.panel}>
      <Suspense fallback={<AdminCardSkeleton />}>
        <GameControls />
      </Suspense>
    </div>
    <div className={styles.panel}>
      <Suspense fallback={<AdminCardSkeleton />}>
        <SessionList />
      </Suspense>
    </div>
  </div>
);

export default Admin;
