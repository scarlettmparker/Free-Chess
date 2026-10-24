import { useTranslation } from '@sun/i18n';
import { CardFooter } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { AdminUserPage } from '~/utils/admin-user-types';

type AdminUserListFooterProps = {
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
 * Matching account count for the admin list.
 */
const AdminUserListFooter = (props: AdminUserListFooterProps) => {
  const { search, page } = props;
  const { t } = useTranslation('admin');
  const { data } = usePageData<AdminUserPage>('adminUsers', 'adminUsers', {
    page: String(page),
    search: search || undefined,
  });

  if (!data?.total) {
    return null;
  }

  return (
    <CardFooter>
      <span>{t('users-count', { count: data.total })}</span>
    </CardFooter>
  );
};

export default AdminUserListFooter;
