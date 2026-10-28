import { Suspense } from 'react';
import ProfileCard from '~/components/profile/profile-card';
import DangerZone from '~/components/profile/danger-zone';
import styles from './manage-account.module.css';

/**
 * Account settings page.
 */
const ManageAccount = () => {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <ProfileCard />
      </Suspense>
      <Suspense fallback={null}>
        <DangerZone />
      </Suspense>
    </main>
  );
};

export default ManageAccount;
