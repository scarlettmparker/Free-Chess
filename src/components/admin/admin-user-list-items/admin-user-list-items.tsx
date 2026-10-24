import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Button } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { AdminUserPage } from '~/utils/admin-user-types';
import styles from './admin-user-list-items.module.css';

type AdminUserListItemsProps = {
  /**
   * Committed search query.
   */
  search: string;
  /**
   * Zero-based page index.
   */
  page: number;
};

/**
 * Account rows for the admin list.
 */
const AdminUserListItems = (props: AdminUserListItemsProps) => {
  const { search, page } = props;
  const { t } = useTranslation('admin');
  const [searchParams] = useSearchParams();
  const params = { page: String(page), search: search || undefined };
  const { data } = usePageData<AdminUserPage>('adminUsers', 'adminUsers', params);

  if (!data?.users.length) {
    return <p className={styles.no_items}>{t('no-users')}</p>;
  }

  return (
    <div className={styles.list_body}>
      {data.users.map((user) => (
        <Link
          key={user.id}
          to={{
            pathname: `/admin/users/${user.id}`,
            search: searchParams.toString(),
          }}
          className={styles.item_link}
        >
          <Button variant="secondary" className={styles.list_button}>
            <span className={styles.list_name}>{user.email}</span>
            <span className={styles.list_meta}>{user.name}</span>
            <span className={styles.list_actions}>
              {user.banned ? t('status-banned') : t(`role-${user.role}`)}
            </span>
          </Button>
        </Link>
      ))}
    </div>
  );
};

export default AdminUserListItems;
