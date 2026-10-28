import { Suspense } from 'react';
import ProfileCard from '~/components/profile/profile-card';
import ProfileHistory from '~/components/profile/profile-history';
import styles from './profile.module.css';

/**
 * Profile page with game history.
 */
const Profile = () => {
  return (
    <main className={styles.page}>
      <div className={styles.profile_column}>
        <Suspense fallback={null}>
          <ProfileCard />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <ProfileHistory />
      </Suspense>
    </main>
  );
};

export default Profile;
