import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Form,
} from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import { CsrfField } from '@sun/ssr/react';
import type { MeQuery } from '~/generated/graphql';
import ProfileAvatar from '~/components/profile/profile-avatar';
import { FREE_CHESS_ADMIN_ROLE } from '~/utils/roles';
import styles from './user-menu.module.css';

/**
 * Avatar menu for the signed-in account.
 */
const UserMenu = () => {
  const { t } = useTranslation('nav');
  const { pathname } = useLocation();
  const { data: user } = usePageData<MeQuery['gaiaQueries']['me'] | null>(
    'currentUser',
    'currentUser',
    {},
  );
  const { data: roles } = usePageData<string[]>('currentRoles', 'currentRoles', {});

  if (!user) return null;

  const isAdmin = roles?.includes(FREE_CHESS_ADMIN_ROLE) ?? false;
  const profileActive = pathname === '/profile' || pathname.startsWith('/profile/');
  const adminActive = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <div className={styles.account}>
      <Link to="/profile">
        <Button variant={profileActive ? 'default' : 'secondary'}>{t('profile')}</Button>
      </Link>
      {isAdmin ? (
        <Link to="/admin">
          <Button variant={adminActive ? 'default' : 'secondary'}>{t('admin')}</Button>
        </Link>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={styles.trigger} type="button" aria-label={t('account')}>
            <ProfileAvatar username={user.username} size={32} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={styles.content}>
          <Card className={styles.card}>
            <CardHeader className={styles.header}>
              <ProfileAvatar username={user.username} size={64} />
              <div className={styles.header_text}>
                <CardTitle>{user.username}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </div>
            </CardHeader>
            <CardBody className={styles.body}>
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
            <CardFooter className={styles.footer}>
              <Link to="/manage-account">
                <Button>{t('manage-account')}</Button>
              </Link>
              <Form action="/__logout" method="post">
                <CsrfField />
                <Button type="submit" variant="secondary">
                  {t('logout')}
                </Button>
              </Form>
            </CardFooter>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
