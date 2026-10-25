import { Suspense, useTransition } from 'react';
import { useOutlet, useSearchParams } from 'react-router-dom';
import AdminCardSkeleton from '~/components/admin/admin-card-skeleton';
import AdminPageSkeleton from '~/components/admin/admin-page-skeleton';

import AdminUserList from '~/components/admin/admin-user-list';
import AdminUserPlaceholder from '~/components/admin/admin-user-placeholder';
import styles from './users.module.css';

/**
 * Account list with a detail outlet.
 */
const Users = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const outlet = useOutlet();
  const search = searchParams.get('search') ?? '';
  const pageParam = Number(searchParams.get('page') ?? '0');
  const page = Number.isFinite(pageParam) && pageParam >= 0 ? pageParam : 0;

  const updateParams = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    return next;
  };

  const handleSearch = (value: string) => {
    const next = updateParams('search', value || null);
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (nextPage: number) => {
    startTransition(() => {
      setSearchParams(updateParams('page', nextPage > 0 ? String(nextPage) : null));
    });
  };

  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <div className={styles.layout}>
        <div className={styles.list_panel}>
          <AdminUserList
            search={search}
            page={page}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
          />
        </div>
        <div className={styles.detail_panel}>
          <Suspense fallback={<AdminCardSkeleton />}>{outlet ?? <AdminUserPlaceholder />}</Suspense>
        </div>
      </div>
    </Suspense>
  );
};

export default Users;
