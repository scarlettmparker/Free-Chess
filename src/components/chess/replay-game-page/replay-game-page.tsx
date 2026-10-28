import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import ReplayGame from '~/components/chess/replay-game';
import type { ReplayGameData } from '~/utils/games-data';
import styles from './replay-game-page.module.css';

type ReplayGamePageProps = {
  /**
   * Game id from the route.
   */
  gameId: string;
};

/**
 * Loads and renders one stored game replay.
 */
const ReplayGamePage = (props: ReplayGamePageProps) => {
  const { gameId } = props;
  const { t } = useTranslation('play');
  const { data: game } = usePageData<ReplayGameData | null>('replay', 'replay', {
    id: gameId,
  });

  if (!game) {
    return (
      <main className={styles.page}>
        <p className={styles.notice}>{t('not-found')}</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <ReplayGame game={game} />
    </main>
  );
};

export default ReplayGamePage;
