import { Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import UserMenu from '~/components/user-menu';
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
  const { data: currentUser } = usePageData<MeQuery['gaiaQueries']['me'] | null>(
    'currentUser',
    'currentUser',
    {},
  );

  if (!currentUser) {
    return (
      <Link to="/login" className={styles.account}>
        <Button variant="secondary" className={styles.button}>
          {t('sign-in')}
        </Button>
      </Link>
    );
  }

  return <UserMenu />;
};

export default Nav;
