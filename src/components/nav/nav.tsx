import { Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button, Form } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import { RoleCheck, CsrfField } from '~/utils/sun-ssr';
import type { CurrentUser } from '~/utils/global-data';
import styles from './nav.module.css';

/**
 * Top navigation with the account controls.
 */
const Nav = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/login')) return null;

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.link}>
        <Button variant="secondary" className={styles.button}>
          Free Chess
        </Button>
      </Link>
      <Suspense fallback={null}>
        <NavAccount />
      </Suspense>
    </nav>
  );
};

/**
 * Guest or signed-in account controls.
 */
const NavAccount = () => {
  const { t } = useTranslation('nav');
  const { data: currentUser } = usePageData<CurrentUser | null>('currentUser', 'currentUser', {});

  if (!currentUser) {
    return (
      <Link to="/login" className={styles.account}>
        <Button variant="secondary" className={styles.button}>
          {t('sign-in')}
        </Button>
      </Link>
    );
  }

  return (
    <div className={styles.account}>
      <span className={styles.email}>{currentUser.email}</span>
      <RoleCheck roles={['admin', 'game-admin', 'user-admin']} match="any">
        <span className={styles.admin}>{t('admin')}</span>
      </RoleCheck>
      <Form action="/__logout" method="post">
        <CsrfField />
        <Button type="submit" variant="secondary" className={styles.button}>
          {t('logout')}
        </Button>
      </Form>
    </div>
  );
};

export default Nav;
