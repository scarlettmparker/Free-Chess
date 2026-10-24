import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button } from '@sun/components';
import RoleCheck from '~/utils/role-check';
import styles from './admin-subnav.module.css';

const NAV_ITEMS = [
  { labelKey: 'game', href: '/admin', roles: ['admin', 'game-admin'] },
  { labelKey: 'users', href: '/admin/users', roles: ['admin', 'user-admin'] },
] as const;

/**
 * Finds the most specific nav item matching the current pathname.
 *
 * @param pathname Current pathname.
 * @returns Matching href, or undefined.
 */
const getActiveHref = (pathname: string) => {
  return [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname.startsWith(item.href))?.href;
};

/**
 * Sub-navigation for the admin section.
 */
const AdminSubnav = () => {
  const { t } = useTranslation('admin');
  const { pathname } = useLocation();
  const activeHref = getActiveHref(pathname);

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => (
        <RoleCheck key={item.href} roles={[...item.roles]} match="any">
          <Link to={item.href} className={styles.link}>
            <Button variant={item.href === activeHref ? 'default' : 'secondary'}>
              {t(item.labelKey)}
            </Button>
          </Link>
        </RoleCheck>
      ))}
    </nav>
  );
};

export default AdminSubnav;
