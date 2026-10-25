import { Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button, Form } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import CsrfField from '~/utils/csrf-field';
import RoleCheck from '~/utils/role-check';
import type { MeQuery } from '~/generated/graphql';
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
  const { data: currentUser } = usePageData<MeQuery["gaiaQueries"]["me"] | null>('currentUser', 'currentUser', {});

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
      <RoleCheck roles={['admin', 'game-admin', 'user-admin']} match="any">
        <Link to="/admin" className={styles.link}>
          <Button variant="secondary" className={styles.button}>
            {t('admin')}
          </Button>
        </Link>
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
