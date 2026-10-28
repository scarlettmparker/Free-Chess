import { usePageData } from '@sun/ssr/react';
import CreateGameForm from '~/components/lobby/create-game-form';
import OpenGames from '~/components/lobby/open-games';
import type { LobbyData } from '~/utils/games-data';
import styles from './lobby-content.module.css';

/**
 * Lobby data and game creation controls.
 */
const LobbyContent = () => {
  const { data } = usePageData<LobbyData>('lobby', 'lobby', {});

  return (
    <div className={styles.content}>
      <CreateGameForm layouts={data.layouts} signedIn={data.signedIn} />
      <OpenGames games={data.games} />
    </div>
  );
};

export default LobbyContent;
