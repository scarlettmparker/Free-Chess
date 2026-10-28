import { useTranslation } from '@sun/i18n';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { MeQuery } from '~/generated/graphql';
import ProfileAvatar from '~/components/profile/profile-avatar';
import styles from './profile-card.module.css';

/**
 * Profile card for the signed-in account.
 */
const ProfileCard = () => {
  const { t } = useTranslation('profile');
  const { data: user } = usePageData<MeQuery['gaiaQueries']['me'] | null>(
    'currentUser',
    'currentUser',
    {},
  );
  const { data: roles } = usePageData<string[]>('currentRoles', 'currentRoles', {});

  if (!user) return null;

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <ProfileAvatar username={user.username} size={64} />
        <div className={styles.heading}>
          <CardTitle>{user.username}</CardTitle>
          <CardDescription>@{user.username}</CardDescription>
        </div>
      </CardHeader>
      <CardBody>
        {roles?.length ? (
          <ul className={styles.roles}>
            {roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.no_roles}>{t('no-roles')}</p>
        )}
      </CardBody>
    </Card>
  );
};

export default ProfileCard;
