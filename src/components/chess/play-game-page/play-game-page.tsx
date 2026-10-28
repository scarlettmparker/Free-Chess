import { useTranslation } from '@sun/i18n';
import { usePageData } from '@sun/ssr/react';
import PlayGame from '~/components/chess/play-game';
import type { PlayGameData } from '~/utils/games-data';
import styles from './play-game-page.module.css';

type PlayGamePageProps = {
  /**
   * Game id from the route.
   */
  gameId: string;
};

/**
 * Loads and renders one live game.
 */
const PlayGamePage = (props: PlayGamePageProps) => {
  const { gameId } = props;
  const { t } = useTranslation('play');
  const { data: game } = usePageData<PlayGameData | null>('game', 'game', { id: gameId });

  if (!game) {
    return (
      <main className={styles.page}>
        <p className={styles.notice}>{t('not-found')}</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{t('live-title')}</h1>
      <PlayGame game={game} />
    </main>
  );
};

export default PlayGamePage;
