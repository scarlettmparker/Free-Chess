import { useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '@sun/i18n';
import { Pagination } from '@sun/components';
import { usePageData } from '@sun/ssr/react';
import type { GameHistoryData } from '~/utils/games-data';
import GameHistoryCard from '~/components/profile/game-history-card';
import styles from './profile-history.module.css';

/**
 * Game history for the signed-in account.
 */
const ProfileHistory = () => {
  const { t } = useTranslation('profile');
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const page = Number(searchParams.get('page') ?? '0');
  const { data } = usePageData<GameHistoryData>('gameHistory', 'gameHistory', {
    page: String(page),
  });

  /**
   * Changes the history page through the URL.
   *
   * @param nextPage One based page number.
   */
  const changePage = (nextPage: number) => {
    startTransition(() => {
      const next = new URLSearchParams(searchParams);
      if (nextPage > 1) next.set('page', String(nextPage - 1));
      else next.delete('page');
      setSearchParams(next);
    });
  };

  return (
    <section className={styles.section} aria-label={t('game-history')}>
      {data.games.length === 0 ? (
        <p className={styles.no_games}>{t('no-games')}</p>
      ) : (
        <ul className={styles.history}>
          {data.games.map((game) => (
            <li key={game.id}>
              <GameHistoryCard game={game} />
            </li>
          ))}
        </ul>
      )}

      {data.totalPages > 1 ? (
        <Pagination
          className={styles.pagination}
          page={page + 1}
          totalPages={data.totalPages}
          onPageChange={changePage}
        />
      ) : null}
    </section>
  );
};

export default ProfileHistory;
