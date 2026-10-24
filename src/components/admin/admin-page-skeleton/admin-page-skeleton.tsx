import AdminCardSkeleton from '~/components/admin/admin-card-skeleton';
import styles from './admin-page-skeleton.module.css';

/**
 * Placeholder for the admin page while its panels load.
 */
const AdminPageSkeleton = () => (
  <div className={styles.layout}>
    <div className={styles.panel}>
      <AdminCardSkeleton />
    </div>
    <div className={styles.panel}>
      <AdminCardSkeleton />
    </div>
  </div>
);

export default AdminPageSkeleton;
